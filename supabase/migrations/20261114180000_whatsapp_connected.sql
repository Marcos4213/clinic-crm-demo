-- Connected integration state, inbound timestamp, long-lived token metadata,
-- per-clinic AI toggle (default off), and an authenticated diagnostics RPC.
-- No tokens, phone secrets, or patient content are exposed.

begin;

alter table public.integration_status
  drop constraint if exists integration_status_state;

alter table public.integration_status
  add constraint integration_status_state
  check (state in ('unconfigured', 'pending', 'connected', 'error'));

alter table public.integration_status
  add column if not exists last_inbound_at timestamptz;

alter table public.clinic_settings
  add column if not exists ai_replies_enabled boolean not null default false;

alter table private.whatsapp_credentials
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_type text,
  add column if not exists subscribed_apps_ok boolean not null default false,
  add column if not exists phone_registered boolean not null default false;

alter table private.whatsapp_credentials
  drop constraint if exists whatsapp_credentials_token_type_len;

alter table private.whatsapp_credentials
  add constraint whatsapp_credentials_token_type_len
  check (token_type is null or char_length(token_type) <= 64);

create or replace function private.ingest_whatsapp_event(
  p_phone_number_id text,
  p_provider_message_id text,
  p_kind text,
  p_message_type text,
  p_body text,
  p_status text,
  p_wa_id text,
  p_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  route public.whatsapp_routes%rowtype;
  current_row public.whatsapp_messages%rowtype;
  next_status text;
  lead_id uuid;
begin
  if p_provider_message_id is null or p_phone_number_id is null then
    return jsonb_build_object('action', 'ignore');
  end if;
  select *
    into route
  from public.whatsapp_routes
  where phone_number_id = p_phone_number_id;
  if not found then
    return jsonb_build_object('action', 'ignore');
  end if;

  select *
    into current_row
  from public.whatsapp_messages
  where phone_number_id = p_phone_number_id
    and provider_message_id = p_provider_message_id
  for update;

  if found then
    if p_kind = 'status' and private.whatsapp_status_rank(p_status) >= private.whatsapp_status_rank(current_row.status) then
      next_status := case when p_status = 'failed' then 'failed' else p_status end;
      if private.whatsapp_status_rank(current_row.status) > private.whatsapp_status_rank(p_status) and p_status <> 'failed' then
        next_status := current_row.status;
      end if;
      update public.whatsapp_messages
      set status = next_status,
          error_code = coalesce(p_error_code, error_code),
          updated_at = now()
      where id = current_row.id;
    end if;
    return jsonb_build_object('action', 'duplicate', 'id', current_row.id);
  end if;

  if p_kind = 'status' then
    return jsonb_build_object('action', 'ignore');
  end if;

  if p_kind = 'message' and p_message_type = 'text' and p_wa_id is not null then
    select lead.id
      into lead_id
    from public.leads as lead
    where lead.clinic_id = route.clinic_id
      and lead.phone = p_wa_id
    limit 1;
    if lead_id is null then
      insert into public.leads (clinic_id, name, phone, procedure_name, temperature, stage, ai_active)
      values (route.clinic_id, 'Contato WhatsApp', p_wa_id, '', 'morno', 'em-atendimento', false)
      returning id into lead_id;
    end if;
  end if;

  insert into public.whatsapp_messages (
    clinic_id, route_id, phone_number_id, wa_id, provider_message_id, direction, message_type, body, status, error_code
  )
  values (
    route.clinic_id,
    route.id,
    p_phone_number_id,
    p_wa_id,
    p_provider_message_id,
    'inbound',
    coalesce(p_message_type, 'unsupported'),
    case when p_message_type = 'text' then left(p_body, 4096) else null end,
    case
      when p_message_type = 'text' then 'received'
      else 'unsupported'
    end,
    p_error_code
  );

  if p_kind = 'message' then
    update public.integration_status
    set state = 'connected',
        last_inbound_at = pg_catalog.now(),
        detail = 'Mensagem recebida. Canal conectado.'
    where clinic_id = route.clinic_id
      and provider = 'whatsapp';
  end if;

  return jsonb_build_object('action', 'stored');
end;
$$;

drop function if exists public.store_whatsapp_signup(uuid, uuid, text, text, text, text);

create or replace function public.store_whatsapp_signup(
  p_clinic uuid,
  p_user uuid,
  p_phone text,
  p_waba text,
  p_app text,
  p_token text,
  p_token_expires_at timestamptz default null,
  p_token_type text default null,
  p_subscribed_apps_ok boolean default false,
  p_phone_registered boolean default false,
  p_detail text default null,
  p_state text default 'pending'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_state text;
  next_state text;
  next_detail text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_phone !~ '^[0-9]{6,32}$' or p_waba !~ '^[0-9]{6,32}$' or p_app !~ '^[0-9]{6,32}$' then
    raise exception 'invalid whatsapp ids' using errcode = '22023';
  end if;
  if p_user is null or p_token is null or char_length(p_token) < 20 or char_length(p_token) > 4096 then
    raise exception 'invalid token' using errcode = '22023';
  end if;
  if p_state is not null and p_state not in ('pending', 'connected', 'error') then
    raise exception 'invalid integration state' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.clinic_memberships as membership
    join public.clinics as clinic on clinic.id = membership.clinic_id
    where membership.clinic_id = p_clinic
      and membership.user_id = p_user
      and membership.role = 'owner'
      and clinic.is_demo = false
  ) then
    raise exception 'owner required' using errcode = '42501';
  end if;
  insert into public.whatsapp_routes (clinic_id, phone_number_id, waba_id, meta_app_id, created_by)
  values (p_clinic, p_phone, p_waba, p_app, p_user)
  on conflict (clinic_id) do update
    set phone_number_id = excluded.phone_number_id,
        waba_id = excluded.waba_id,
        meta_app_id = excluded.meta_app_id;
  insert into private.whatsapp_credentials (
    clinic_id, access_token, token_expires_at, token_type, subscribed_apps_ok, phone_registered
  )
  values (
    p_clinic, p_token, p_token_expires_at, p_token_type, coalesce(p_subscribed_apps_ok, false), coalesce(p_phone_registered, false)
  )
  on conflict (clinic_id) do update
    set access_token = excluded.access_token,
        token_expires_at = excluded.token_expires_at,
        token_type = excluded.token_type,
        subscribed_apps_ok = excluded.subscribed_apps_ok,
        phone_registered = excluded.phone_registered,
        updated_at = pg_catalog.now();

  select state into current_state
  from public.integration_status
  where clinic_id = p_clinic and provider = 'whatsapp';

  next_detail := left(coalesce(p_detail, 'Cadastro Meta recebido. Aguardando a primeira mensagem da paciente.'), 300);
  next_state := coalesce(p_state, 'pending');
  if current_state = 'connected' and next_state is distinct from 'error' then
    next_state := 'connected';
  end if;

  update public.integration_status
  set state = next_state,
      detail = next_detail
  where clinic_id = p_clinic
    and provider = 'whatsapp';
end;
$$;

revoke all on function public.store_whatsapp_signup(uuid, uuid, text, text, text, text, timestamptz, text, boolean, boolean, text, text) from public, anon, authenticated;
grant execute on function public.store_whatsapp_signup(uuid, uuid, text, text, text, text, timestamptz, text, boolean, boolean, text, text) to service_role;

create or replace function private.whatsapp_clinic_diagnostics(p_clinic uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if private.member_role(p_clinic) is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'route_present', exists (select 1 from public.whatsapp_routes as route where route.clinic_id = p_clinic),
    'last_inbound_at', status.last_inbound_at,
    'subscribed_apps_ok', coalesce(creds.subscribed_apps_ok, false),
    'token_present', (creds.clinic_id is not null),
    'phone_registered', coalesce(creds.phone_registered, false),
    'state', coalesce(status.state, 'unconfigured'),
    'detail', status.detail
  )
  into result
  from (select p_clinic as clinic_id) as scoped
  left join public.integration_status as status
    on status.clinic_id = scoped.clinic_id and status.provider = 'whatsapp'
  left join private.whatsapp_credentials as creds
    on creds.clinic_id = scoped.clinic_id;
  return result;
end;
$$;

create or replace function public.whatsapp_clinic_diagnostics(p_clinic uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.whatsapp_clinic_diagnostics(p_clinic);
end;
$$;

revoke all on function private.whatsapp_clinic_diagnostics(uuid) from public, anon, authenticated;
revoke all on function public.whatsapp_clinic_diagnostics(uuid) from public, anon;
grant execute on function public.whatsapp_clinic_diagnostics(uuid) to authenticated;

commit;
