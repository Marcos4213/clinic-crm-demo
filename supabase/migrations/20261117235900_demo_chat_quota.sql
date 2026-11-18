-- Hit counters for the public C4 demo chat. Stores a hashed subject and a count.
-- No message text. RLS on, no policies: the publishable key cannot read or write.
-- The edge function calls demo_chat_hit with the service role.

create table public.demo_chat_quota (
  scope text not null,
  subject text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (scope, subject, window_start),
  constraint demo_chat_quota_scope_check check (scope in ('ip', 'session')),
  constraint demo_chat_quota_hits_check check (hits >= 0)
);

alter table public.demo_chat_quota enable row level security;

revoke all on table public.demo_chat_quota from public, anon, authenticated;
grant select, insert, update, delete on table public.demo_chat_quota to service_role;

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
