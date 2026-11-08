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
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'convertize-test-c@example.test',
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
  appt_a uuid;
  offer_id uuid;
  offers jsonb;
  seen integer;
  definer_count integer;
  created_by_seen uuid;
  failed boolean;
begin
  select public.schema_guard() into guard;
  if coalesce((guard->>'ok')::boolean, false) is not true or (guard->>'version')::int <> 2 then
    raise exception 'schema_guard failed: %', guard;
  end if;

  select count(*)
    into definer_count
  from pg_proc as proc
  join pg_namespace as namespace on namespace.oid = proc.pronamespace
  where namespace.nspname = 'public'
    and proc.prosecdef;
  if definer_count <> 0 then
    raise exception 'public schema still has % security definer functions', definer_count;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_one_resource_at_a_time'
      and contype = 'x'
  ) then
    raise exception 'resource exclusion constraint is missing';
  end if;

  if exists (
    select 1
    from pg_proc as proc
    join pg_namespace as namespace on namespace.oid = proc.pronamespace
    where namespace.nspname in ('public', 'private')
      and proc.prokind = 'f'
      and not exists (
        select 1
        from unnest(coalesce(proc.proconfig, array[]::text[])) as cfg
        where cfg like 'search_path=%'
      )
  ) then
    raise exception 'a public or private function is missing search_path';
  end if;

  begin
    execute 'set local role anon';
    perform public.bootstrap_workspace('Anon');
    raise exception 'anon executed bootstrap_workspace';
  exception
    when insufficient_privilege then
      null;
  end;
  execute 'reset role';

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

  select count(*) into seen
  from public.clinic_resources
  where clinic_id = clinic_a and capacity = 1;
  if seen <> 1 then
    raise exception 'expected one capacity-1 resource, got %', seen;
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

  begin
    insert into public.appointments (clinic_id, lead_id, starts_at, ends_at, status)
    values (clinic_a, lead_a, '2026-11-20 10:00:00+00', '2026-11-20 10:30:00+00', 'scheduled');
    raise exception 'outside business hours was allowed';
  exception
    when invalid_parameter_value then
      null;
  end;

  begin
    insert into public.appointments (clinic_id, lead_id, starts_at, ends_at, status)
    values (clinic_a, lead_a, '2020-01-06 13:00:00+00', '2020-01-06 13:30:00+00', 'scheduled');
    raise exception 'past appointment was allowed';
  exception
    when invalid_parameter_value then
      null;
  end;

  insert into public.appointments (clinic_id, lead_id, starts_at, ends_at, status)
  values (
    clinic_a,
    lead_a,
    '2026-11-20 13:00:00+00',
    '2026-11-20 13:30:00+00',
    'scheduled'
  )
  returning id into appt_a;

  select appointment.created_by
    into created_by_seen
  from public.appointments as appointment
  where appointment.id = appt_a;
  if created_by_seen is distinct from '11111111-1111-4111-8111-111111111111'::uuid then
    raise exception 'created_by was not the caller: %', created_by_seen;
  end if;

  begin
    update public.appointments
    set created_by = '22222222-2222-4222-8222-222222222222'
    where id = appt_a;
    raise exception 'owner changed created_by';
  exception
    when insufficient_privilege then
      if sqlerrm not like '%created_by%' then
        raise;
      end if;
  end;

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
    when exclusion_violation or invalid_parameter_value then
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

  begin
    perform public.replace_slot_offers(
      clinic_a,
      lead_a,
      jsonb_build_array(jsonb_build_object(
        'starts_at', '2026-11-20T13:00:00+00',
        'ends_at', '2026-11-20T13:30:00+00'
      ))
    );
    raise exception 'busy slot was offered';
  exception
    when invalid_parameter_value then
      null;
  end;

  offers := public.replace_slot_offers(
    clinic_a,
    lead_a,
    jsonb_build_array(jsonb_build_object(
      'starts_at', '2027-06-15T16:00:00+00',
      'ends_at', '2027-06-15T16:30:00+00'
    ))
  );
  offer_id := (offers -> 0 ->> 'id')::uuid;
  if offer_id is null then
    raise exception 'valid offer was not stored';
  end if;

  execute 'reset role';
  insert into public.clinic_memberships (clinic_id, user_id, role)
  values (clinic_a, '33333333-3333-4333-8333-333333333333', 'staff');
  perform set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  execute 'set local role authenticated';

  begin
    update public.appointments
    set created_by = '33333333-3333-4333-8333-333333333333'
    where id = appt_a;
    raise exception 'staff changed created_by';
  exception
    when insufficient_privilege then
      if sqlerrm not like '%created_by%' then
        raise;
      end if;
  end;

  update public.appointments
  set status = 'attended'
  where id = appt_a;
  if not found then
    raise exception 'staff could not record attendance';
  end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  execute 'set local role authenticated';

  begin
    perform public.replace_slot_offers(clinic_a, lead_a, '[]'::jsonb);
    raise exception 'cross-tenant replace_slot_offers was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.create_appointment_from_offer(offer_id);
    raise exception 'cross-tenant create_appointment_from_offer was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.append_ai_message(clinic_a, lead_a, 'invasao');
    raise exception 'cross-tenant append_ai_message was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.consume_ai_quota(clinic_a);
    raise exception 'cross-tenant consume_ai_quota was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform 1 from private.ai_quota;
    raise exception 'authenticated read private.ai_quota';
  exception
    when insufficient_privilege then
      null;
  end;

  failed := false;
  if failed then
    raise exception 'unreachable';
  end if;
end;
$$;

rollback;
