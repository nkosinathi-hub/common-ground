-- Reminder delivery and housekeeping on pg_cron (hosted Supabase installs it into pg_catalog,
-- with its tables in schema cron). cron.schedule by job name is idempotent.
create extension if not exists pg_cron with schema pg_catalog;

-- Runs every minute without a session, so public.notify records no actor. Each due reminder is
-- claimed with skip locked; one more than an hour late is retired unsent, and nobody who declined
-- is reminded. A yearly reminder moves on to the next occurrence instead of being marked sent.
create or replace function public.deliver_event_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare r record; n integer := 0;
begin
  for r in
    select rem.id, rem.space_id, rem.event_id, rem.user_id, rem.remind_at, rem.minutes_before,
      e.repeats_yearly, a.rsvp
    from public.calendar_event_reminders rem
    join public.calendar_events e on e.id = rem.event_id
    left join public.calendar_event_attendees a on a.event_id = rem.event_id and a.user_id = rem.user_id
    where rem.sent_at is null and rem.remind_at <= now()
    order by rem.remind_at
    limit 1000
    for update of rem skip locked
  loop
    if r.remind_at > now() - interval '1 hour' and r.rsvp is distinct from 'declined' then
      perform public.notify(r.user_id, r.space_id, 'event_reminder', 'calendar_event', r.event_id,
        'event_reminder:' || r.id || ':' || floor(extract(epoch from r.remind_at))::bigint);
      n := n + 1;
    end if;
    if r.repeats_yearly then
      update public.calendar_event_reminders
      set remind_at = public.next_remind_at(r.event_id, r.minutes_before,
        greatest(r.remind_at + interval '1 day', now()))
      where id = r.id;
    else
      update public.calendar_event_reminders set sent_at = now() where id = r.id;
    end if;
  end loop;
  return n;
end;
$$;

revoke execute on function public.deliver_event_reminders() from public, anon, authenticated;

select cron.schedule('calendar-reminders', '* * * * *', 'select public.deliver_event_reminders()');
select cron.schedule('space-notes-expiry', '17 3 * * *',
  $$delete from public.space_notes where expires_at < now() - interval '30 days'$$);
select cron.schedule('cron-history-purge', '23 3 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$);
