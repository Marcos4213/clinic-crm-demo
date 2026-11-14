-- Diagnostics RPC is called by the Edge Function after a membership check.
-- Do not expose the SECURITY DEFINER function to authenticated clients.
-- When invoked as service_role, skip member_role (auth.uid() is absent).

create or replace function private.whatsapp_clinic_diagnostics(p_clinic uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.role() is distinct from 'service_role' and private.member_role(p_clinic) is null then
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

revoke all on function public.whatsapp_clinic_diagnostics(uuid) from public, anon, authenticated;
grant execute on function public.whatsapp_clinic_diagnostics(uuid) to service_role;
