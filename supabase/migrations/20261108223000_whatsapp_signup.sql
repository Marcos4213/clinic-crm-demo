create table private.whatsapp_credentials (
  clinic_id uuid primary key references public.clinics (id) on delete cascade,
  access_token text not null,
  updated_at timestamptz not null default now(),
  constraint whatsapp_credentials_token_len check (char_length(access_token) between 20 and 4096)
);

alter table private.whatsapp_credentials enable row level security;
alter table private.whatsapp_credentials force row level security;
revoke all on table private.whatsapp_credentials from public, anon, authenticated;

create or replace function public.store_whatsapp_signup(
  p_clinic uuid,
  p_user uuid,
  p_phone text,
  p_waba text,
  p_app text,
  p_token text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
  insert into private.whatsapp_credentials (clinic_id, access_token)
  values (p_clinic, p_token)
  on conflict (clinic_id) do update
    set access_token = excluded.access_token,
        updated_at = pg_catalog.now();
  update public.integration_status
  set state = 'pending',
      detail = 'Cadastro Meta recebido. Sem prova de entrega.'
  where clinic_id = p_clinic
    and provider = 'whatsapp';
end;
$$;

revoke all on function public.store_whatsapp_signup(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.store_whatsapp_signup(uuid, uuid, text, text, text, text) to service_role;

create or replace function public.whatsapp_clinic_token(p_clinic uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  select access_token into token
  from private.whatsapp_credentials
  where clinic_id = p_clinic;
  return token;
end;
$$;

revoke all on function public.whatsapp_clinic_token(uuid) from public, anon, authenticated;
grant execute on function public.whatsapp_clinic_token(uuid) to service_role;
