-- Convertize core schema for project xjijlccnbrdpwctiacqa (Postgres 17).
-- Apply as one transaction. Do not run a partial copy.
-- The previous attempt failed with 42P01 because language sql helpers named
-- public.clinic_memberships before that table existed. Those helpers are created
-- only after slot_offers_lead_idx. check_function_bodies stays at its default ON.
-- Privileged bodies live in schema private, which is not an exposed API schema.
-- Public wrappers are SECURITY INVOKER and do not accept a user id.
-- Authorization uses clinic_memberships. Never use user_metadata or app_metadata.
-- No patient seed. A persisted demo exists only when an authenticated user calls create_demo_workspace().
-- This script does not claim the remote project already has these objects.

begin;

create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Sao_Paulo',
  is_demo boolean not null default false,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint clinics_name_len check (char_length(btrim(name)) between 2 and 120),
  constraint clinics_timezone_sp check (timezone = 'America/Sao_Paulo')
);

create table public.clinic_memberships (
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (clinic_id, user_id),
  constraint clinic_memberships_role check (role in ('owner', 'staff'))
);

create index clinic_memberships_user_idx on public.clinic_memberships (user_id);

create table public.clinic_settings (
  clinic_id uuid primary key references public.clinics (id) on delete cascade,
  display_name text not null,
  business_faq text not null default '',
  slot_minutes integer not null default 30,
  day_start time not null default time '09:00',
  day_end time not null default time '18:00',
  updated_at timestamptz not null default now(),
  constraint clinic_settings_slot check (slot_minutes in (30, 60)),
  constraint clinic_settings_hours check (day_end > day_start),
  constraint clinic_settings_faq_len check (char_length(business_faq) <= 4000)
);

create table public.integration_status (
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  provider text not null,
  state text not null default 'unconfigured',
  detail text not null default '',
  primary key (clinic_id, provider),
  constraint integration_status_provider check (provider in ('grok', 'whatsapp', 'instagram', 'google_calendar')),
  constraint integration_status_state check (state in ('unconfigured', 'pending')),
  constraint integration_status_detail_len check (char_length(detail) <= 300)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  name text not null,
  phone text not null,
  procedure_name text not null default '',
  temperature text not null,
  stage text not null,
  ai_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_name_len check (char_length(btrim(name)) between 2 and 120),
  constraint leads_phone_len check (char_length(phone) between 8 and 40),
  constraint leads_temperature check (temperature in ('quente', 'morno', 'frio')),
  constraint leads_stage check (stage in ('em-atendimento', 'qualificados', 'agendados', 'fechados')),
  constraint leads_clinic_id_key unique (clinic_id, id)
);

create index leads_clinic_stage_idx on public.leads (clinic_id, stage);

create table public.lead_stage_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  lead_id uuid not null,
  from_stage text,
  to_stage text not null,
  actor_id uuid,
  created_at timestamptz not null default now(),
  constraint lead_stage_events_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete cascade,
  constraint lead_stage_events_to check (to_stage in ('em-atendimento', 'qualificados', 'agendados', 'fechados'))
);

create index lead_stage_events_clinic_idx on public.lead_stage_events (clinic_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  lead_id uuid not null,
  author_role text not null,
  body text not null,
  channel text not null default 'internal',
  delivery text not null default 'local',
  created_at timestamptz not null default now(),
  constraint messages_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete cascade,
  constraint messages_author check (author_role in ('cliente', 'ia', 'humano')),
  constraint messages_channel check (channel = 'internal'),
  constraint messages_delivery check (delivery = 'local'),
  constraint messages_body_len check (char_length(btrim(body)) between 1 and 4000)
);

create index messages_lead_idx on public.messages (clinic_id, lead_id, created_at);

-- Capacity is exactly 1. A second practitioner is a second resource, not a second
-- simultaneous booking on this row. Clients cannot insert resources.
create table public.clinic_resources (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  name text not null,
  capacity integer not null default 1,
  created_at timestamptz not null default now(),
  constraint clinic_resources_capacity_one check (capacity = 1),
  constraint clinic_resources_name_len check (char_length(btrim(name)) between 2 and 80),
  constraint clinic_resources_clinic_id_key unique (clinic_id, id)
);

comment on table public.clinic_resources is
  'Each resource accepts one scheduled appointment at a time. Overlapping bookings on the same resource are rejected. Adding a practitioner means adding a resource.';

create index clinic_resources_clinic_idx on public.clinic_resources (clinic_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  lead_id uuid not null,
  resource_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null,
  notes text not null default '',
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint appointments_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete restrict,
  constraint appointments_resource_fk
    foreign key (clinic_id, resource_id) references public.clinic_resources (clinic_id, id),
  constraint appointments_status check (status in ('scheduled', 'attended', 'no_show', 'canceled')),
  constraint appointments_range check (ends_at > starts_at and ends_at <= starts_at + interval '8 hours'),
  constraint appointments_notes_len check (char_length(notes) <= 1000),
  constraint appointments_scheduled_has_resource check (status <> 'scheduled' or resource_id is not null),
  constraint appointments_one_resource_at_a_time
    exclude using gist (
      resource_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    )
    where (status = 'scheduled')
);

comment on constraint appointments_one_resource_at_a_time on public.appointments is
  'Capacity 1 per resource. This constraint does not allow two practitioners to share one resource at the same time.';

create index appointments_clinic_start_idx on public.appointments (clinic_id, starts_at);

create table public.slot_offers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  lead_id uuid not null,
  resource_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint slot_offers_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete cascade,
  constraint slot_offers_resource_fk
    foreign key (clinic_id, resource_id) references public.clinic_resources (clinic_id, id),
  constraint slot_offers_range check (ends_at > starts_at and ends_at <= starts_at + interval '8 hours')
);

create index slot_offers_lead_idx on public.slot_offers (clinic_id, lead_id, expires_at);

-- language sql helpers. clinic_memberships already exists above, so check_function_bodies can stay on.
create or replace function private.is_member(target_clinic uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinic_memberships as membership
    where membership.clinic_id = target_clinic
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function private.member_role(target_clinic uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select membership.role
  from public.clinic_memberships as membership
  where membership.clinic_id = target_clinic
    and membership.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function private.is_member(uuid) from public, anon;
revoke all on function private.member_role(uuid) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.member_role(uuid) to authenticated;

create table private.ai_quota (
  clinic_id uuid not null,
  window_start timestamptz not null,
  requests integer not null default 0,
  primary key (clinic_id, window_start),
  constraint ai_quota_requests check (requests >= 0)
);

revoke all on table private.ai_quota from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_touch
  before update on public.leads
  for each row execute function private.touch_updated_at();

create trigger clinic_settings_touch
  before update on public.clinic_settings
  for each row execute function private.touch_updated_at();

create or replace function private.freeze_lead_clinic()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.clinic_id is distinct from old.clinic_id then
    raise exception 'clinic_id is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger leads_freeze_clinic
  before update on public.leads
  for each row execute function private.freeze_lead_clinic();

create or replace function private.assert_bookable(
  target_clinic uuid,
  target_resource uuid,
  p_starts timestamptz,
  p_ends timestamptz,
  require_future boolean,
  ignore_appointment uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  day_start time;
  day_end time;
  local_start timestamp;
  local_end timestamp;
begin
  if require_future and p_starts <= pg_catalog.now() then
    raise exception 'appointment must be in the future' using errcode = '22023';
  end if;

  select settings.day_start, settings.day_end
    into day_start, day_end
  from public.clinic_settings as settings
  where settings.clinic_id = target_clinic;

  if day_start is null then
    raise exception 'clinic settings missing' using errcode = 'P0002';
  end if;

  local_start := pg_catalog.timezone('America/Sao_Paulo', p_starts);
  local_end := pg_catalog.timezone('America/Sao_Paulo', p_ends);
  if local_start::date <> local_end::date
     or local_start::time < day_start
     or local_end::time > day_end then
    raise exception 'outside business hours' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.appointments as booked
    where booked.resource_id = target_resource
      and booked.status = 'scheduled'
      and (ignore_appointment is null or booked.id <> ignore_appointment)
      and tstzrange(booked.starts_at, booked.ends_at, '[)') && tstzrange(p_starts, p_ends, '[)')
  ) then
    raise exception 'slot is not free' using errcode = '22023';
  end if;
end;
$$;
create or replace function private.guard_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resource_count integer;
  sole_resource uuid;
  time_changed boolean;
begin
  if tg_op = 'UPDATE' then
    if new.clinic_id is distinct from old.clinic_id
       or new.lead_id is distinct from old.lead_id
       or new.resource_id is distinct from old.resource_id then
      raise exception 'appointment tenant reference is immutable' using errcode = '42501';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception 'created_by is immutable' using errcode = '42501';
    end if;
  else
    if new.created_by is not null and new.created_by is distinct from auth.uid() then
      raise exception 'created_by must be the current user' using errcode = '42501';
    end if;
    new.created_by := auth.uid();
  end if;

  if new.resource_id is null then
    select count(*)::integer
      into resource_count
    from public.clinic_resources as resource
    where resource.clinic_id = new.clinic_id;
    if resource_count <> 1 then
      raise exception 'resource required' using errcode = '22023';
    end if;
    select resource.id
      into sole_resource
    from public.clinic_resources as resource
    where resource.clinic_id = new.clinic_id;
    new.resource_id := sole_resource;
  elsif not exists (
    select 1
    from public.clinic_resources as resource
    where resource.id = new.resource_id
      and resource.clinic_id = new.clinic_id
  ) then
    raise exception 'resource is not in this clinic' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    time_changed := true;
  else
    time_changed := new.starts_at is distinct from old.starts_at
      or new.ends_at is distinct from old.ends_at;
  end if;
  if new.status = 'scheduled'
     and (tg_op = 'INSERT' or time_changed or old.status is distinct from 'scheduled') then
    perform private.assert_bookable(
      new.clinic_id,
      new.resource_id,
      new.starts_at,
      new.ends_at,
      time_changed,
      case when tg_op = 'UPDATE' then new.id else null end
    );
  end if;
  return new;
end;
$$;

create trigger appointments_guard
  before insert or update on public.appointments
  for each row execute function private.guard_appointment();

create or replace function private.record_stage_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_stage_events (clinic_id, lead_id, from_stage, to_stage, actor_id)
    values (new.clinic_id, new.id, null, new.stage, auth.uid());
    return new;
  end if;
  if new.stage is distinct from old.stage then
    insert into public.lead_stage_events (clinic_id, lead_id, from_stage, to_stage, actor_id)
    values (new.clinic_id, new.id, old.stage, new.stage, auth.uid());
  end if;
  return new;
end;
$$;

create trigger leads_stage_event
  after insert or update of stage on public.leads
  for each row execute function private.record_stage_event();

revoke all on function private.touch_updated_at() from public, anon, authenticated;
revoke all on function private.freeze_lead_clinic() from public, anon, authenticated;
revoke all on function private.assert_bookable(uuid, uuid, timestamptz, timestamptz, boolean, uuid) from public, anon, authenticated;
revoke all on function private.guard_appointment() from public, anon, authenticated;
revoke all on function private.record_stage_event() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privileged operations. Bodies stay in private. Public wrappers are below.
-- ---------------------------------------------------------------------------

create or replace function private.bootstrap_workspace(clinic_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  existing uuid;
  new_id uuid;
  clean_name text := btrim(clinic_name);
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'invalid clinic name' using errcode = '22023';
  end if;

  select membership.clinic_id
    into existing
  from public.clinic_memberships as membership
  join public.clinics as clinic on clinic.id = membership.clinic_id
  where membership.user_id = uid
    and membership.role = 'owner'
    and clinic.is_demo = false
  order by clinic.created_at
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.clinics (name, created_by, is_demo)
  values (clean_name, uid, false)
  returning id into new_id;

  insert into public.clinic_memberships (clinic_id, user_id, role)
  values (new_id, uid, 'owner');

  insert into public.clinic_settings (clinic_id, display_name)
  values (new_id, clean_name);

  insert into public.integration_status (clinic_id, provider, state, detail)
  values
    (new_id, 'grok', 'unconfigured', 'XAI_API_KEY ainda não está no servidor'),
    (new_id, 'whatsapp', 'unconfigured', 'Provedor oficial não configurado'),
    (new_id, 'instagram', 'unconfigured', 'Provedor oficial não configurado'),
    (new_id, 'google_calendar', 'unconfigured', 'Google Calendar não está conectado');

  insert into public.clinic_resources (clinic_id, name)
  values (new_id, 'Agenda da clínica');

  return new_id;
end;
$$;

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
  values ('Convertize · demonstração fictícia', uid, true)
  returning id into new_id;

  insert into public.clinic_memberships (clinic_id, user_id, role)
  values (new_id, uid, 'owner');

  insert into public.clinic_settings (clinic_id, display_name, business_faq)
  values (
    new_id,
    'Convertize · demonstração fictícia',
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

create or replace function private.consume_ai_quota(target_clinic uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  window_at timestamptz := date_trunc('hour', now());
  used integer;
begin
  if uid is null or not private.is_member(target_clinic) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into private.ai_quota (clinic_id, window_start, requests)
  values (target_clinic, window_at, 1)
  on conflict (clinic_id, window_start)
  do update set requests = private.ai_quota.requests + 1
  returning requests into used;

  if used > 30 then
    raise exception 'ai quota exceeded' using errcode = 'P0001';
  end if;
  return 30 - used;
end;
$$;

create or replace function private.assert_ai_active(target_clinic uuid, target_lead uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  active boolean;
begin
  if auth.uid() is null or not private.is_member(target_clinic) then
    return false;
  end if;
  select lead.ai_active
    into active
  from public.leads as lead
  where lead.id = target_lead
    and lead.clinic_id = target_clinic
  for update;
  return coalesce(active, false);
end;
$$;

create or replace function private.append_ai_message(target_clinic uuid, target_lead uuid, message_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  active boolean;
  new_id uuid;
  clean text := btrim(message_body);
begin
  if auth.uid() is null or not private.is_member(target_clinic) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if clean is null or char_length(clean) < 1 or char_length(clean) > 4000 then
    raise exception 'invalid message' using errcode = '22023';
  end if;

  select lead.ai_active
    into active
  from public.leads as lead
  where lead.id = target_lead
    and lead.clinic_id = target_clinic
  for update;

  if coalesce(active, false) = false then
    return null;
  end if;

  insert into public.messages (clinic_id, lead_id, author_role, body, channel, delivery)
  values (target_clinic, target_lead, 'ia', clean, 'internal', 'local')
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function private.replace_slot_offers(target_clinic uuid, target_lead uuid, slots jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_ok boolean;
  sole_resource uuid;
  item jsonb;
  slot_start timestamptz;
  slot_end timestamptz;
  accepted tstzrange[] := '{}';
begin
  if auth.uid() is null or not private.is_member(target_clinic) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(slots) is distinct from 'array' or jsonb_array_length(slots) > 12 then
    raise exception 'invalid slots' using errcode = '22023';
  end if;

  select true
    into lead_ok
  from public.leads as lead
  where lead.id = target_lead
    and lead.clinic_id = target_clinic;
  if lead_ok is not true then
    raise exception 'lead not in clinic' using errcode = '42501';
  end if;

  select resource.id
    into strict sole_resource
  from public.clinic_resources as resource
  where resource.clinic_id = target_clinic;

  for item in select value from jsonb_array_elements(slots)
  loop
    slot_start := (item->>'starts_at')::timestamptz;
    slot_end := (item->>'ends_at')::timestamptz;
    if slot_end <= slot_start or slot_end > slot_start + interval '8 hours' then
      raise exception 'invalid slot range' using errcode = '22023';
    end if;
    if exists (select 1 from unnest(accepted) as taken where taken && tstzrange(slot_start, slot_end, '[)')) then
      raise exception 'slot is not free' using errcode = '22023';
    end if;
    if exists (
      select 1
      from public.slot_offers as offer
      where offer.resource_id = sole_resource
        and offer.lead_id <> target_lead
        and offer.consumed_at is null
        and offer.expires_at > pg_catalog.now()
        and tstzrange(offer.starts_at, offer.ends_at, '[)') && tstzrange(slot_start, slot_end, '[)')
    ) then
      raise exception 'slot is not free' using errcode = '22023';
    end if;
    perform private.assert_bookable(target_clinic, sole_resource, slot_start, slot_end, true, null);
    accepted := accepted || tstzrange(slot_start, slot_end, '[)');
  end loop;

  delete from public.slot_offers as offer
  where offer.clinic_id = target_clinic
    and offer.lead_id = target_lead
    and offer.consumed_at is null;

  insert into public.slot_offers (clinic_id, lead_id, resource_id, starts_at, ends_at, expires_at)
  select
    target_clinic,
    target_lead,
    sole_resource,
    (slot.value->>'starts_at')::timestamptz,
    (slot.value->>'ends_at')::timestamptz,
    pg_catalog.now() + interval '30 minutes'
  from jsonb_array_elements(slots) as slot(value);

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', offer.id,
      'starts_at', offer.starts_at,
      'ends_at', offer.ends_at,
      'resource_id', offer.resource_id
    ) order by offer.starts_at), '[]'::jsonb)
    from public.slot_offers as offer
    where offer.clinic_id = target_clinic
      and offer.lead_id = target_lead
      and offer.consumed_at is null
      and offer.expires_at > pg_catalog.now()
  );
exception
  when too_many_rows then
    raise exception 'resource required' using errcode = '22023';
  when no_data_found then
    raise exception 'clinic has no resource' using errcode = 'P0002';
end;
$$;

create or replace function private.create_appointment_from_offer(target_offer uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  offer public.slot_offers%rowtype;
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select *
    into offer
  from public.slot_offers
  where id = target_offer
  for update;

  if not found then
    raise exception 'offer not found' using errcode = 'P0002';
  end if;
  if not private.is_member(offer.clinic_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if offer.consumed_at is not null then
    raise exception 'offer consumed' using errcode = 'P0001';
  end if;
  if offer.expires_at <= pg_catalog.now() then
    raise exception 'offer expired' using errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(offer.resource_id::text, 0));
  perform private.assert_bookable(offer.clinic_id, offer.resource_id, offer.starts_at, offer.ends_at, true, null);

  insert into public.appointments (clinic_id, lead_id, resource_id, starts_at, ends_at, status, created_by)
  values (offer.clinic_id, offer.lead_id, offer.resource_id, offer.starts_at, offer.ends_at, 'scheduled', auth.uid())
  returning id into new_id;

  update public.slot_offers
  set consumed_at = pg_catalog.now()
  where id = offer.id;

  return new_id;
exception
  when exclusion_violation then
    raise exception 'appointment conflict' using errcode = '23P01';
end;
$$;

revoke all on function private.bootstrap_workspace(text) from public, anon;
revoke all on function private.create_demo_workspace() from public, anon;
revoke all on function private.consume_ai_quota(uuid) from public, anon;
revoke all on function private.assert_ai_active(uuid, uuid) from public, anon;
revoke all on function private.append_ai_message(uuid, uuid, text) from public, anon;
revoke all on function private.replace_slot_offers(uuid, uuid, jsonb) from public, anon;
revoke all on function private.create_appointment_from_offer(uuid) from public, anon;

-- Invoker wrappers need execute on the private body. private is not an exposed API schema.
-- The private bodies still reject a caller who is not a member and never take a user id.
grant execute on function private.bootstrap_workspace(text) to authenticated;
grant execute on function private.create_demo_workspace() to authenticated;
grant execute on function private.consume_ai_quota(uuid) to authenticated;
grant execute on function private.assert_ai_active(uuid, uuid) to authenticated;
grant execute on function private.append_ai_message(uuid, uuid, text) to authenticated;
grant execute on function private.replace_slot_offers(uuid, uuid, jsonb) to authenticated;
grant execute on function private.create_appointment_from_offer(uuid) to authenticated;

-- Public entry points are SECURITY INVOKER. They do not run as the owner.
create or replace function public.bootstrap_workspace(clinic_name text)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.bootstrap_workspace(clinic_name);
$$;

create or replace function public.create_demo_workspace()
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_demo_workspace();
$$;

create or replace function public.consume_ai_quota(target_clinic uuid)
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.consume_ai_quota(target_clinic);
$$;

create or replace function public.assert_ai_active(target_clinic uuid, target_lead uuid)
returns boolean
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.assert_ai_active(target_clinic, target_lead);
$$;

create or replace function public.append_ai_message(target_clinic uuid, target_lead uuid, message_body text)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.append_ai_message(target_clinic, target_lead, message_body);
$$;

create or replace function public.replace_slot_offers(target_clinic uuid, target_lead uuid, slots jsonb)
returns jsonb
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.replace_slot_offers(target_clinic, target_lead, slots);
$$;

create or replace function public.create_appointment_from_offer(target_offer uuid)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_appointment_from_offer(target_offer);
$$;

create or replace function public.schema_guard()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'ok', coalesce((
      select pg_catalog.bool_and(relation.relrowsecurity and relation.relforcerowsecurity)
      from pg_catalog.pg_class as relation
      join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relkind = 'r'
        and relation.relname in (
          'clinics',
          'clinic_memberships',
          'clinic_settings',
          'integration_status',
          'leads',
          'lead_stage_events',
          'messages',
          'clinic_resources',
          'appointments',
          'slot_offers'
        )
    ), false)
    and (
      select count(*) = 10
      from pg_catalog.pg_class as relation
      join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relkind = 'r'
        and relation.relname in (
          'clinics',
          'clinic_memberships',
          'clinic_settings',
          'integration_status',
          'leads',
          'lead_stage_events',
          'messages',
          'clinic_resources',
          'appointments',
          'slot_offers'
        )
    ),
    'version', 2
  );
$$;

revoke all on function public.bootstrap_workspace(text) from public, anon;
revoke all on function public.create_demo_workspace() from public, anon;
revoke all on function public.consume_ai_quota(uuid) from public, anon;
revoke all on function public.assert_ai_active(uuid, uuid) from public, anon;
revoke all on function public.append_ai_message(uuid, uuid, text) from public, anon;
revoke all on function public.replace_slot_offers(uuid, uuid, jsonb) from public, anon;
revoke all on function public.create_appointment_from_offer(uuid) from public, anon;
revoke all on function public.schema_guard() from public, anon;

grant execute on function public.bootstrap_workspace(text) to authenticated;
grant execute on function public.create_demo_workspace() to authenticated;
grant execute on function public.consume_ai_quota(uuid) to authenticated;
grant execute on function public.assert_ai_active(uuid, uuid) to authenticated;
grant execute on function public.append_ai_message(uuid, uuid, text) to authenticated;
grant execute on function public.replace_slot_offers(uuid, uuid, jsonb) to authenticated;
grant execute on function public.create_appointment_from_offer(uuid) to authenticated;
grant execute on function public.schema_guard() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS. Enabled and forced before any client grant.
-- ---------------------------------------------------------------------------

alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.integration_status enable row level security;
alter table public.leads enable row level security;
alter table public.lead_stage_events enable row level security;
alter table public.messages enable row level security;
alter table public.clinic_resources enable row level security;
alter table public.appointments enable row level security;
alter table public.slot_offers enable row level security;

alter table public.clinics force row level security;
alter table public.clinic_memberships force row level security;
alter table public.clinic_settings force row level security;
alter table public.integration_status force row level security;
alter table public.leads force row level security;
alter table public.lead_stage_events force row level security;
alter table public.messages force row level security;
alter table public.clinic_resources force row level security;
alter table public.appointments force row level security;
alter table public.slot_offers force row level security;

create policy clinics_select on public.clinics
  for select to authenticated
  using ((select private.is_member(id)));

create policy memberships_select on public.clinic_memberships
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy settings_select on public.clinic_settings
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy settings_update on public.clinic_settings
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy integrations_select on public.integration_status
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy leads_select on public.leads
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy leads_insert on public.leads
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy leads_update on public.leads
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy leads_delete on public.leads
  for delete to authenticated
  using ((select private.is_member(clinic_id)));

create policy stage_events_select on public.lead_stage_events
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy messages_select on public.messages
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    (select private.is_member(clinic_id))
    and author_role in ('humano', 'cliente')
    and channel = 'internal'
    and delivery = 'local'
  );

create policy resources_select on public.clinic_resources
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy appointments_select on public.appointments
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy appointments_insert on public.appointments
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy appointments_update on public.appointments
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy appointments_delete on public.appointments
  for delete to authenticated
  using (
    (select private.is_member(clinic_id))
    and (select private.member_role(clinic_id)) = 'owner'
  );

create policy slot_offers_select on public.slot_offers
  for select to authenticated
  using ((select private.is_member(clinic_id)));

-- ---------------------------------------------------------------------------
-- Grants. Anon receives nothing on these tables.
-- ---------------------------------------------------------------------------

revoke all on table public.clinics from anon, authenticated;
revoke all on table public.clinic_memberships from anon, authenticated;
revoke all on table public.clinic_settings from anon, authenticated;
revoke all on table public.integration_status from anon, authenticated;
revoke all on table public.leads from anon, authenticated;
revoke all on table public.lead_stage_events from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.clinic_resources from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
revoke all on table public.slot_offers from anon, authenticated;

grant select on table public.clinics to authenticated;
grant select on table public.clinic_memberships to authenticated;
grant select, update on table public.clinic_settings to authenticated;
grant select on table public.integration_status to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select on table public.lead_stage_events to authenticated;
grant select, insert on table public.messages to authenticated;
grant select on table public.clinic_resources to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;
grant select on table public.slot_offers to authenticated;

create view public.appointment_schedule
with (security_invoker = true) as
select id, clinic_id, resource_id, lead_id, starts_at, ends_at, status
from public.appointments;

revoke all on table public.appointment_schedule from anon, authenticated;
grant select on table public.appointment_schedule to authenticated;

commit;
