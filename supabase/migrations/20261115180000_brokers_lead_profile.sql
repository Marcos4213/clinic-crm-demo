-- Plantão: corretores, roleta, qualificação, notas e eventos da ficha do lead.
-- RLS por clínica, no mesmo padrão de public.leads.
-- NÃO aplicar em produção até revisão explícita.

begin;

create table public.brokers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brokers_name_len check (char_length(btrim(name)) between 2 and 80),
  constraint brokers_clinic_id_key unique (clinic_id, id)
);

create index brokers_clinic_order_idx on public.brokers (clinic_id, sort_order, name);

create table public.roulette_state (
  clinic_id uuid primary key references public.clinics (id) on delete cascade,
  next_broker_id uuid,
  updated_at timestamptz not null default now(),
  constraint roulette_state_broker_fk
    foreign key (clinic_id, next_broker_id) references public.brokers (clinic_id, id)
    on delete set null (next_broker_id)
);

alter table public.leads
  add column broker_id uuid,
  add column next_step text not null default '',
  add column next_step_at timestamptz,
  add column next_step_broker_id uuid,
  add constraint leads_next_step_len check (char_length(next_step) <= 200),
  add constraint leads_broker_fk
    foreign key (clinic_id, broker_id) references public.brokers (clinic_id, id)
    on delete set null (broker_id),
  add constraint leads_next_step_broker_fk
    foreign key (clinic_id, next_step_broker_id) references public.brokers (clinic_id, id)
    on delete set null (next_step_broker_id);

create table public.lead_qualifications (
  lead_id uuid primary key,
  clinic_id uuid not null,
  deal_type text not null default '',
  region text not null default '',
  budget text not null default '',
  payment text not null default '',
  deadline text not null default '',
  updated_at timestamptz not null default now(),
  constraint lead_qualifications_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete cascade,
  constraint lead_qualifications_deal check (deal_type in ('', 'compra', 'aluguel')),
  constraint lead_qualifications_region_len check (char_length(region) <= 120),
  constraint lead_qualifications_budget_len check (char_length(budget) <= 80),
  constraint lead_qualifications_payment_len check (char_length(payment) <= 120),
  constraint lead_qualifications_deadline_len check (char_length(deadline) <= 80)
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  lead_id uuid not null,
  body text not null,
  author_name text not null default '',
  created_at timestamptz not null default now(),
  constraint lead_notes_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete cascade,
  constraint lead_notes_body_len check (char_length(btrim(body)) between 1 and 2000),
  constraint lead_notes_author_len check (char_length(author_name) <= 80)
);

create index lead_notes_lead_idx on public.lead_notes (clinic_id, lead_id, created_at desc);

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  lead_id uuid not null,
  event_type text not null,
  detail text not null default '',
  actor text not null default '',
  created_at timestamptz not null default now(),
  constraint lead_events_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete cascade,
  constraint lead_events_type check (event_type in (
    'message', 'temperature', 'assumed', 'assigned', 'visit', 'qualification', 'note', 'returned'
  )),
  constraint lead_events_detail_len check (char_length(detail) <= 1000),
  constraint lead_events_actor_len check (char_length(actor) <= 80)
);

create index lead_events_lead_idx on public.lead_events (clinic_id, lead_id, created_at);

alter table public.brokers enable row level security;
alter table public.roulette_state enable row level security;
alter table public.lead_qualifications enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_events enable row level security;

alter table public.brokers force row level security;
alter table public.roulette_state force row level security;
alter table public.lead_qualifications force row level security;
alter table public.lead_notes force row level security;
alter table public.lead_events force row level security;

create policy brokers_select on public.brokers
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy brokers_insert on public.brokers
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy brokers_update on public.brokers
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy brokers_delete on public.brokers
  for delete to authenticated
  using (
    (select private.is_member(clinic_id))
    and (select private.member_role(clinic_id)) = 'owner'
  );

create policy roulette_select on public.roulette_state
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy roulette_insert on public.roulette_state
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy roulette_update on public.roulette_state
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy qualifications_select on public.lead_qualifications
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy qualifications_insert on public.lead_qualifications
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy qualifications_update on public.lead_qualifications
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy notes_select on public.lead_notes
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy notes_insert on public.lead_notes
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy notes_update on public.lead_notes
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy notes_delete on public.lead_notes
  for delete to authenticated
  using ((select private.is_member(clinic_id)));

create policy lead_events_select on public.lead_events
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy lead_events_insert on public.lead_events
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

revoke all on table public.brokers from anon, authenticated;
revoke all on table public.roulette_state from anon, authenticated;
revoke all on table public.lead_qualifications from anon, authenticated;
revoke all on table public.lead_notes from anon, authenticated;
revoke all on table public.lead_events from anon, authenticated;

grant select, insert, update on table public.brokers to authenticated;
grant delete on table public.brokers to authenticated;
grant select, insert, update on table public.roulette_state to authenticated;
grant select, insert, update on table public.lead_qualifications to authenticated;
grant select, insert, update, delete on table public.lead_notes to authenticated;
grant select, insert on table public.lead_events to authenticated;

commit;
