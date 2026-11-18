-- The first version of demo_chat_hit used a variable named window_start,
-- which collided with the column. This replaces it with v_window.

create or replace function public.demo_chat_hit(
  p_scope text,
  p_subject text,
  p_window_seconds integer,
  p_limit integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_hits integer;
  v_window timestamptz;
begin
  if p_scope not in ('ip', 'session') then
    return false;
  end if;
  if p_window_seconds < 60 or p_window_seconds > 86400 then
    return false;
  end if;
  if p_limit < 1 or p_limit > 100 then
    return false;
  end if;
  if p_subject is null or length(p_subject) < 8 or length(p_subject) > 64 then
    return false;
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.demo_chat_quota as q (scope, subject, window_start, hits)
  values (p_scope, p_subject, v_window, 1)
  on conflict (scope, subject, window_start)
  do update set hits = q.hits + 1
  returning hits into current_hits;

  delete from public.demo_chat_quota
  where demo_chat_quota.window_start < now() - interval '2 days';

  return current_hits <= p_limit;
end;
$$;

revoke all on function public.demo_chat_hit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.demo_chat_hit(text, text, integer, integer) to service_role;
