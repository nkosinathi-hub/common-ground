-- The creator attends (going) with the event's default reminders; moving an event moves every
-- reminder for it and makes them due again.
create or replace function public.calendar_events_add_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.space_members m
    where m.space_id = new.space_id and m.user_id = new.created_by) then
    return null;
  end if;
  insert into public.calendar_event_attendees (space_id, event_id, user_id, rsvp, responded_at, added_by)
  values (new.space_id, new.id, new.created_by, 'going', now(), new.created_by)
  on conflict (event_id, user_id) do nothing;
  perform public.add_default_reminders(new.id, new.created_by);
  return null;
end;
$$;

create trigger calendar_events_add_creator after insert on public.calendar_events
  for each row execute function public.calendar_events_add_creator();

create or replace function public.calendar_events_reschedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.starts_at, old.start_date, old.time_zone, old.all_day, old.repeats_yearly)
    is not distinct from (new.starts_at, new.start_date, new.time_zone, new.all_day, new.repeats_yearly)
  then
    return null;
  end if;
  update public.calendar_event_reminders r
  set remind_at = public.next_remind_at(new.id, r.minutes_before, now()), sent_at = null
  where r.event_id = new.id;
  return null;
end;
$$;

create trigger calendar_events_reschedule
  after update of starts_at, start_date, time_zone, all_day, repeats_yearly on public.calendar_events
  for each row execute function public.calendar_events_reschedule();

revoke execute on function public.calendar_events_add_creator() from public, anon, authenticated;
revoke execute on function public.calendar_events_reschedule() from public, anon, authenticated;
