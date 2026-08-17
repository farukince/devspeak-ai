create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (user_id, endpoint, window_start)
);

alter table public.practice_sessions
drop constraint if exists practice_sessions_client_request_id_key;

alter table public.practice_sessions
drop constraint if exists practice_sessions_user_client_request_unique;

alter table public.practice_sessions
add constraint practice_sessions_user_client_request_unique unique (user_id, client_request_id);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_rate_limit(
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_limit < 1 or p_window_seconds < 1 then raise exception 'Invalid rate limit configuration'; end if;
  v_window_start := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);

  insert into public.api_rate_limits(user_id, endpoint, window_start, request_count)
  values (v_user_id, left(p_endpoint, 200), v_window_start, 1)
  on conflict (user_id, endpoint, window_start)
  do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into v_count;

  return query select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    greatest(ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer, 1);
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;
