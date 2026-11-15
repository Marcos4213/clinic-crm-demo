-- Plantão: cadastro de imóveis, vínculo com leads e agenda de visitas.
-- RLS por clínica, no mesmo padrão de public.leads e public.brokers.
-- NÃO aplicar em produção até revisão explícita.

begin;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  code text not null,
  title text not null,
  deal_type text not null,
  property_type text not null,
  region text not null,
  price numeric(14, 2) not null,
  bedrooms integer not null default 0,
  area_m2 integer,
  status text not null default 'disponivel',
  photo_path text not null default '',
  details text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_code_len check (char_length(btrim(code)) between 2 and 20),
  constraint properties_title_len check (char_length(btrim(title)) between 2 and 160),
  constraint properties_region_len check (char_length(btrim(region)) between 2 and 80),
  constraint properties_details_len check (char_length(details) <= 2000),
  constraint properties_photo_len check (char_length(photo_path) <= 300),
  constraint properties_price_positive check (price > 0),
  constraint properties_bedrooms_range check (bedrooms between 0 and 20),
  constraint properties_area_range check (area_m2 is null or area_m2 between 10 and 20000),
  constraint properties_deal check (deal_type in ('venda', 'aluguel')),
  constraint properties_type check (property_type in ('apartamento', 'casa', 'cobertura', 'sala', 'kitnet', 'studio')),
  constraint properties_status check (status in ('disponivel', 'reservado', 'vendido', 'alugado')),
  constraint properties_clinic_code_key unique (clinic_id, code),
  constraint properties_clinic_id_key unique (clinic_id, id)
);

create index properties_clinic_filter_idx on public.properties (clinic_id, deal_type, status, region);

create table public.lead_properties (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  lead_id uuid not null,
  property_id uuid not null,
  relation text not null,
  created_at timestamptz not null default now(),
  constraint lead_properties_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete cascade,
  constraint lead_properties_property_fk
    foreign key (clinic_id, property_id) references public.properties (clinic_id, id) on delete cascade,
  constraint lead_properties_relation check (relation in ('suggested', 'linked')),
  constraint lead_properties_unique unique (clinic_id, lead_id, property_id, relation)
);

create index lead_properties_lead_idx on public.lead_properties (clinic_id, lead_id);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  lead_id uuid not null,
  property_id uuid,
  broker_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'agendada',
  reminder_status text not null default 'pendente_envio',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_lead_fk
    foreign key (clinic_id, lead_id) references public.leads (clinic_id, id) on delete restrict,
  constraint visits_property_fk
    foreign key (clinic_id, property_id) references public.properties (clinic_id, id) on delete set null (property_id),
  constraint visits_broker_fk
    foreign key (clinic_id, broker_id) references public.brokers (clinic_id, id) on delete set null (broker_id),
  constraint visits_status check (status in ('agendada', 'confirmada', 'feita', 'no_show')),
  constraint visits_reminder check (reminder_status in ('pendente_envio', 'enviado', 'nao_enviar')),
  constraint visits_range check (ends_at > starts_at and ends_at <= starts_at + interval '8 hours'),
  constraint visits_notes_len check (char_length(notes) <= 1000)
);

create index visits_clinic_start_idx on public.visits (clinic_id, starts_at);
create index visits_broker_start_idx on public.visits (clinic_id, broker_id, starts_at);

alter table public.properties enable row level security;
alter table public.lead_properties enable row level security;
alter table public.visits enable row level security;

alter table public.properties force row level security;
alter table public.lead_properties force row level security;
alter table public.visits force row level security;

create policy properties_select on public.properties
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy properties_insert on public.properties
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy properties_update on public.properties
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy properties_delete on public.properties
  for delete to authenticated
  using (
    (select private.is_member(clinic_id))
    and (select private.member_role(clinic_id)) = 'owner'
  );

create policy lead_properties_select on public.lead_properties
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy lead_properties_insert on public.lead_properties
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy lead_properties_update on public.lead_properties
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy lead_properties_delete on public.lead_properties
  for delete to authenticated
  using ((select private.is_member(clinic_id)));

create policy visits_select on public.visits
  for select to authenticated
  using ((select private.is_member(clinic_id)));

create policy visits_insert on public.visits
  for insert to authenticated
  with check ((select private.is_member(clinic_id)));

create policy visits_update on public.visits
  for update to authenticated
  using ((select private.is_member(clinic_id)))
  with check ((select private.is_member(clinic_id)));

create policy visits_delete on public.visits
  for delete to authenticated
  using (
    (select private.is_member(clinic_id))
    and (select private.member_role(clinic_id)) = 'owner'
  );

revoke all on table public.properties from anon, authenticated;
revoke all on table public.lead_properties from anon, authenticated;
revoke all on table public.visits from anon, authenticated;

grant select, insert, update on table public.properties to authenticated;
grant delete on table public.properties to authenticated;
grant select, insert, update, delete on table public.lead_properties to authenticated;
grant select, insert, update on table public.visits to authenticated;
grant delete on table public.visits to authenticated;

commit;
