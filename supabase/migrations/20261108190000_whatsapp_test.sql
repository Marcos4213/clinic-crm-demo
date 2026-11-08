-- WhatsApp test number routing and message dedup.
-- Helpers are created after the tables they read. check_function_bodies stays on.
-- No phone number, token, app secret, or verify token is seeded.

begin;

do $$ begin
  create role service_role nologin;
exception when duplicate_object then null;
end $$;

grant usage on schema private to service_role;

create table public.whatsapp_routes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  phone_number_id text not null,
  waba_id text not null,
  meta_app_id text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint whatsapp_routes_phone_unique unique (phone_number_id),
  constraint whatsapp_routes_clinic_unique unique (clinic_id),
  constraint whatsapp_routes_phone_digits check (phone_number_id ~ '^[0-9]{6,32}$'),
  constraint whatsapp_routes_waba_digits check (waba_id ~ '^[0-9]{6,32}$'),
  constraint whatsapp_routes_app_digits check (meta_app_id ~ '^[0-9]{6,32}$')
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  route_id uuid not null references public.whatsapp_routes (id) on delete cascade,
  phone_number_id text not null,
  wa_id text,
  provider_message_id text not null,
  direction text not null,
  message_type text not null,
  body text,
  status text not null,
  idempotency_key text,
  error_code text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_messages_direction check (direction in ('inbound', 'outbound')),
  constraint whatsapp_messages_status check (status in ('received', 'accepted', 'sent', 'delivered', 'read', 'failed', 'unsupported')),
  constraint whatsapp_messages_body_len check (body is null or char_length(body) <= 4096),
  constraint whatsapp_messages_provider_unique unique (phone_number_id, provider_message_id)
);

create unique index whatsapp_messages_idempotency_uidx
  on public.whatsapp_messages (clinic_id, idempotency_key)
  where idempotency_key is not null;

create index whatsapp_messages_clinic_idx on public.whatsapp_messages (clinic_id, received_at desc);

create or replace function private.whatsapp_status_rank(p_status text)
returns integer
language sql
immutable
security invoker
set search_path = ''
as $$
  select case p_status
    when 'unsupported' then 0
    when 'received' then 1
    when 'accepted' then 1
    when 'sent' then 2
    when 'delivered' then 3
    when 'read' then 4
    when 'failed' then 5
    else 0
  end;
$$;

create or replace function private.bind_whatsapp_route(p_phone text, p_waba text, p_app text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  cid uuid;
  route_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select membership.clinic_id
    into cid
  from public.clinic_memberships as membership
  join public.clinics as clinic on clinic.id = membership.clinic_id
  where membership.user_id = uid
    and membership.role = 'owner'
    and clinic.is_demo = false
  order by clinic.created_at
  limit 1;
  if cid is null or private.member_role(cid) is distinct from 'owner' then
    raise exception 'owner required' using errcode = '42501';
  end if;
  insert into public.whatsapp_routes (clinic_id, phone_number_id, waba_id, meta_app_id, created_by)
  values (cid, p_phone, p_waba, p_app, uid)
  on conflict (clinic_id) do update
    set phone_number_id = excluded.phone_number_id,
        waba_id = excluded.waba_id,
        meta_app_id = excluded.meta_app_id
  returning id into route_id;
  update public.integration_status
  set state = 'pending',
      detail = 'IDs salvos. Sem prova de entrega e sem envio automatico.'
  where clinic_id = cid
    and provider = 'whatsapp';
  return route_id;
end;
$$;

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
    case when p_kind = 'status' then 'outbound' else 'inbound' end,
    coalesce(p_message_type, 'unsupported'),
    case when p_message_type = 'text' then left(p_body, 4096) else null end,
    case
      when p_kind = 'status' then p_status
      when p_message_type = 'text' then 'received'
      else 'unsupported'
    end,
    p_error_code
  );
  return jsonb_build_object('action', 'stored');
end;
$$;

create or replace function private.record_whatsapp_outbound(
  p_phone_number_id text,
  p_idempotency_key text,
  p_wa_id text,
  p_body text,
  p_provider_message_id text,
  p_status text,
  p_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  route public.whatsapp_routes%rowtype;
  existing public.whatsapp_messages%rowtype;
begin
  if p_status not in ('accepted', 'failed') then
    raise exception 'outbound status not allowed' using errcode = '42501';
  end if;
  select *
    into route
  from public.whatsapp_routes
  where phone_number_id = p_phone_number_id;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select *
    into existing
  from public.whatsapp_messages
  where clinic_id = route.clinic_id
    and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('action', 'existing', 'provider_message_id', existing.provider_message_id, 'status', existing.status);
  end if;
  insert into public.whatsapp_messages (
    clinic_id, route_id, phone_number_id, wa_id, provider_message_id, direction, message_type, body, status, idempotency_key, error_code
  )
  values (
    route.clinic_id, route.id, route.phone_number_id, p_wa_id, p_provider_message_id, 'outbound', 'text', left(p_body, 4096), p_status, p_idempotency_key, p_error_code
  );
  return jsonb_build_object('action', 'stored', 'status', p_status);
end;
$$;

revoke all on function private.bind_whatsapp_route(text, text, text) from public, anon;
revoke all on function private.ingest_whatsapp_event(text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function private.record_whatsapp_outbound(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function private.whatsapp_status_rank(text) from public, anon, authenticated;
grant execute on function private.bind_whatsapp_route(text, text, text) to authenticated;
grant execute on function private.record_whatsapp_outbound(text, text, text, text, text, text, text) to service_role;
grant execute on function private.ingest_whatsapp_event(text, text, text, text, text, text, text, text) to service_role;

create or replace function public.bind_whatsapp_route(p_phone text, p_waba text, p_app text)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.bind_whatsapp_route(p_phone, p_waba, p_app);
$$;

create or replace function public.ingest_whatsapp_event(
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
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.ingest_whatsapp_event(
    p_phone_number_id, p_provider_message_id, p_kind, p_message_type, p_body, p_status, p_wa_id, p_error_code
  );
$$;

create or replace function public.record_whatsapp_outbound(
  p_phone_number_id text,
  p_idempotency_key text,
  p_wa_id text,
  p_body text,
  p_provider_message_id text,
  p_status text,
  p_error_code text
)
returns jsonb
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.record_whatsapp_outbound(
    p_phone_number_id, p_idempotency_key, p_wa_id, p_body, p_provider_message_id, p_status, p_error_code
  );
$$;

revoke all on function public.bind_whatsapp_route(text, text, text) from public, anon;
revoke all on function public.ingest_whatsapp_event(text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.record_whatsapp_outbound(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.bind_whatsapp_route(text, text, text) to authenticated;
grant execute on function public.record_whatsapp_outbound(text, text, text, text, text, text, text) to service_role;
grant execute on function public.ingest_whatsapp_event(text, text, text, text, text, text, text, text) to service_role;

alter table public.whatsapp_routes enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_routes force row level security;
alter table public.whatsapp_messages force row level security;

create policy whatsapp_routes_select on public.whatsapp_routes
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy whatsapp_messages_select on public.whatsapp_messages
  for select to authenticated
  using ((select private.is_member(clinic_id)));

revoke all on table public.whatsapp_routes from anon, authenticated;
revoke all on table public.whatsapp_messages from anon, authenticated;
grant select on table public.whatsapp_routes to authenticated;
grant select on table public.whatsapp_messages to authenticated;

create or replace function private.create_demo_workspace()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  existing uuid;
  new_id uuid;
  lead_maria uuid;
  lead_joao uuid;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select membership.clinic_id
    into existing
  from public.clinic_memberships as membership
  join public.clinics as clinic on clinic.id = membership.clinic_id
  where membership.user_id = uid
    and membership.role = 'owner'
    and clinic.is_demo = true
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.clinics (name, created_by, is_demo)
  values ('Automatize.app · demonstração fictícia', uid, true)
  returning id into new_id;

  insert into public.clinic_memberships (clinic_id, user_id, role)
  values (new_id, uid, 'owner');

  insert into public.clinic_settings (clinic_id, display_name, business_faq)
  values (
    new_id,
    'Automatize.app · demonstração fictícia',
    'Amostra: a avaliação é presencial e os horários deste espaço são fictícios.'
  );

  insert into public.integration_status (clinic_id, provider, state, detail)
  values
    (new_id, 'grok', 'unconfigured', 'Demonstração. A chave Grok não é simulada aqui.'),
    (new_id, 'whatsapp', 'unconfigured', 'Sem provedor'),
    (new_id, 'instagram', 'unconfigured', 'Sem provedor'),
    (new_id, 'google_calendar', 'unconfigured', 'Sem conexão');

  insert into public.clinic_resources (clinic_id, name)
  values (new_id, 'Agenda da clínica');

  insert into public.leads (clinic_id, name, phone, procedure_name, temperature, stage, ai_active)
  values (new_id, 'Maria Silva (amostra)', '+55 00 90000-0101', 'Botox', 'quente', 'em-atendimento', true)
  returning id into lead_maria;

  insert into public.leads (clinic_id, name, phone, procedure_name, temperature, stage, ai_active)
  values (new_id, 'João Pedro (amostra)', '+55 00 90000-0105', 'Implante capilar', 'morno', 'qualificados', true)
  returning id into lead_joao;

  insert into public.messages (clinic_id, lead_id, author_role, body, channel, delivery)
  values
    (new_id, lead_maria, 'ia', 'Mensagem fictícia desta demonstração. Não há envio externo.', 'internal', 'local'),
    (new_id, lead_joao, 'cliente', 'Quero entender a avaliação. Este texto é amostra.', 'internal', 'local');

  return new_id;
end;
$$;

update public.clinics
set name = 'Automatize.app · demonstração fictícia'
where is_demo = true
  and name = 'Convertize · demonstração fictícia';

update public.clinic_settings
set display_name = 'Automatize.app · demonstração fictícia'
where display_name = 'Convertize · demonstração fictícia';

commit;
