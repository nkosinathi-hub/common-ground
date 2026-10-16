-- Attendees who have not declined hear when an event's time, dates or place change, or when it
-- is cancelled. The editor is skipped by public.notify. Deleting the whole space sends nothing:
-- by the time the cascade reaches the events, the spaces row is gone.
create or replace function public.calendar_events_notify_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare e public.calendar_events := case when tg_op = 'DELETE' then old else new end; m uuid;
begin
  if tg_op = 'DELETE' then
    if not exists (select 1 from public.spaces s where s.id = old.space_id) then return old; end if;
  elsif (old.starts_at, old.ends_at, old.start_date, old.end_date, old.all_day, old.location)
    is not distinct from (new.starts_at, new.ends_at, new.start_date, new.end_date, new.all_day,
      new.location) then
    return null;
  end if;
  for m in select a.user_id from public.calendar_event_attendees a
    where a.event_id = e.id and a.rsvp <> 'declined' loop
    if tg_op = 'DELETE' then
      perform public.notify(m, e.space_id, 'event_cancelled', 'calendar_event', e.id,
        'event_cancelled:' || e.id || ':' || m);
    else
      perform public.notify(m, e.space_id, 'event_updated', 'calendar_event', e.id,
        'event_updated:' || e.id || ':' || m || ':' || floor(extract(epoch from now()))::bigint);
    end if;
  end loop;
  return case when tg_op = 'DELETE' then old else null end;
end;
$$;

create trigger calendar_events_notify_update
  after update of starts_at, ends_at, start_date, end_date, all_day, location on public.calendar_events
  for each row execute function public.calendar_events_notify_change();
create trigger calendar_events_notify_cancel before delete on public.calendar_events
  for each row execute function public.calendar_events_notify_change();

revoke execute on function public.calendar_events_notify_change() from public, anon, authenticated;
