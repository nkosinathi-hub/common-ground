-- Counts one request for (user, bucket) and says whether it is within max per window.
-- Callable by the service role only: the Edge Function verifies the caller JWT first and
-- passes the verified user id, so there is no auth.uid() in this context to check.
create or replace function public.consume_rate_limit(
  target_user uuid,
  bucket_name text,
  max_requests integer,
  window_seconds integer
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  window_length interval;
  current_count integer;
begin
  if target_user is null or bucket_name is null or char_length(bucket_name) not between 1 and 64 then
    raise exception 'user and bucket are required' using errcode = '22023';
  end if;
  if coalesce(max_requests, 0) < 1 or coalesce(window_seconds, 0) < 1 then
    raise exception 'limit and window must be positive' using errcode = '22023';
  end if;
  window_length := make_interval(secs => window_seconds);

  insert into public.rate_limits as r (user_id, bucket, window_start, count)
  values (target_user, bucket_name, now(), 1)
  on conflict (user_id, bucket) do update
    set window_start = case when r.window_start <= now() - window_length then now() else r.window_start end,
        count = case when r.window_start <= now() - window_length then 1 else r.count + 1 end
  returning r.count into current_count;

  return current_count <= max_requests;
end;
$$;

revoke all on function public.consume_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid, text, integer, integer) to service_role;
