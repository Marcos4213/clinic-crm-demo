-- Convertize RLS and tenancy tests.
-- Run AFTER 20261108170000_convertize_core.sql, as a role that can insert auth.users
-- (SQL editor / postgres). The script rolls back. It does not send email.
-- A green local run is not evidence that project xjijlccnbrdpwctiacqa has this schema.
--
-- Local stub: create auth.users with the columns used below and auth.uid() reading
-- request.jwt.claim.sub before applying the migration. Hosted Supabase already has both.

begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'convertize-test-a@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'convertize-test-b@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  );

grant usage on schema public to anon, authenticated;

do $$
declare
  guard jsonb;
  clinic_a uuid;
  clinic_b uuid;
  lead_a uuid;
  seen integer;
  failed boolean;
begin
  select public.schema_guard() into guard;
  if coalesce((guard->>'ok')::boolean, false) is not true then
    raise exception 'schema_guard failed: %', guard;
  end if;

  -- Anonymous cannot read tenant tables.
  begin
    execute 'set local role anon';
    perform 1 from public.leads;
    raise exception 'anon select on leads was allowed';
  exception
    when insufficient_privilege then
      null;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  execute 'set local role authenticated';

  clinic_a := public.bootstrap_workspace('Clinica A teste');
  if clinic_a is null then
    raise exception 'bootstrap A returned null';
  end if;
  if public.bootstrap_workspace('Outro nome') is distinct from clinic_a then
    raise exception 'bootstrap created a second real clinic for the same owner';
  end if;

  insert into public.leads (clinic_id, name, phone, procedure_name, temperature, stage)
  values (clinic_a, 'Lead A', '+55 00 90000-0191', 'Avaliacao', 'morno', 'em-atendimento')
  returning id into lead_a;

  insert into public.messages (clinic_id, lead_id, author_role, body)
  values (clinic_a, lead_a, 'humano', 'Nota interna');

  begin
    insert into public.messages (clinic_id, lead_id, author_role, body, channel)
    values (clinic_a, lead_a, 'humano', 'nao pode', 'whatsapp');
    raise exception 'whatsapp channel insert was allowed';
  exception
    when check_violation or insufficient_privilege then
      null;
  end;

  begin
    insert into public.messages (clinic_id, lead_id, author_role, body)
    values (clinic_a, lead_a, 'ia', 'cliente nao grava ia');
    raise exception 'client insert of ia message was allowed';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.lead_stage_events (clinic_id, lead_id, to_stage)
    values (clinic_a, lead_a, 'fechados');
    raise exception 'direct stage event insert was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  insert into public.appointments (clinic_id, lead_id, starts_at, ends_at, status)
  values (
    clinic_a,
    lead_a,
    '2026-11-20 13:00:00+00',
    '2026-11-20 13:30:00+00',
    'scheduled'
  );

  begin
    insert into public.appointments (clinic_id, lead_id, starts_at, ends_at, status)
    values (
      clinic_a,
      lead_a,
      '2026-11-20 13:15:00+00',
      '2026-11-20 13:45:00+00',
      'scheduled'
    );
    raise exception 'overlapping scheduled appointment was allowed';
  exception
    when exclusion_violation then
      null;
  end;

  -- Canceled does not occupy the slot.
  insert into public.appointments (clinic_id, lead_id, starts_at, ends_at, status)
  values (
    clinic_a,
    lead_a,
    '2026-11-20 13:15:00+00',
    '2026-11-20 13:45:00+00',
    'canceled'
  );

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  execute 'set local role authenticated';

  select count(*) into seen from public.leads;
  if seen <> 0 then
    raise exception 'user B can see % leads from clinic A', seen;
  end if;

  select count(*) into seen from public.messages;
  if seen <> 0 then
    raise exception 'user B can see messages from clinic A';
  end if;

  select count(*) into seen from public.appointments;
  if seen <> 0 then
    raise exception 'user B can see appointments from clinic A';
  end if;

  begin
    insert into public.leads (clinic_id, name, phone, procedure_name, temperature, stage)
    values (clinic_a, 'Invasao', '+55 00 90000-0192', 'Avaliacao', 'frio', 'qualificados');
    raise exception 'cross-tenant lead insert was allowed';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    update public.leads set stage = 'fechados' where id = lead_a;
    get diagnostics seen = row_count;
    if seen <> 0 then
      raise exception 'cross-tenant lead update changed % rows', seen;
    end if;
  exception
    when insufficient_privilege then
      null;
  end;

  clinic_b := public.bootstrap_workspace('Clinica B teste');
  if clinic_b = clinic_a then
    raise exception 'user B joined clinic A through bootstrap';
  end if;

  begin
    insert into public.appointments (clinic_id, lead_id, starts_at, ends_at, status)
    values (clinic_b, lead_a, '2026-11-21 13:00:00+00', '2026-11-21 13:30:00+00', 'scheduled');
    raise exception 'cross-tenant appointment/lead reference was allowed';
  exception
    when foreign_key_violation or insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.clinic_memberships (clinic_id, user_id, role)
    values (clinic_a, '22222222-2222-4222-8222-222222222222', 'owner');
    raise exception 'user B inserted a membership into clinic A';
  exception
    when insufficient_privilege then
      null;
  end;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  execute 'set local role authenticated';

  begin
    update public.leads set clinic_id = clinic_b where id = lead_a;
    raise exception 'clinic_id change was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  select count(*) into seen
  from public.lead_stage_events
  where lead_id = lead_a;
  if seen < 1 then
    raise exception 'stage history was not recorded for lead A';
  end if;

  failed := false;
  if failed then
    raise exception 'unreachable';
  end if;
end;
$$;

rollback;
