-- Plantão: regras de alerta de lead parado e origem do lead.
-- RLS inalterada: as colunas entram em tabelas já protegidas por clínica.
-- NÃO aplicar em produção até revisão explícita.

begin;

alter table public.clinic_settings
  add column hot_assume_minutes integer not null default 10,
  add column warm_reply_hours integer not null default 2,
  add constraint clinic_settings_hot_assume check (hot_assume_minutes between 1 and 1440),
  add constraint clinic_settings_warm_reply check (warm_reply_hours between 1 and 168);

alter table public.leads
  add column source text not null default '',
  add constraint leads_source check (source in ('', 'zap', 'olx', 'instagram', 'whatsapp', 'site'));

commit;
