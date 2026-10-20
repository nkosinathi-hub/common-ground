-- Stale parties expire uncredited on pg_cron: planned ones nobody started within 6 hours, and
-- live ones still running 12 hours after they started. Runs without a session.
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.expire_watch_parties()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  update public.watch_parties set status = 'cancelled', ended_at = now()
  where (status = 'planned' and created_at < now() - interval '6 hours')
     or (status = 'live' and started_at < now() - interval '12 hours');
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.expire_watch_parties() from public, anon, authenticated;

select cron.schedule('watch-party-expiry', '*/15 * * * *', 'select public.expire_watch_parties()');
