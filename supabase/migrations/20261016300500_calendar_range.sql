-- One calendar window (ADR 0008): from_date to to_date inclusive, as local days in tz.
-- kind is 'event' (timed or one-off all-day), 'occasion' (one occurrence of a yearly event, dated
-- on that occurrence), 'task' (by due date) or 'milestone' (by target date). At most 1000 rows;
-- the client treats a full result as truncated and narrows the window. Runs under RLS.
create index tasks_due on public.tasks (space_id, due_date) where due_date is not null;
create index milestones_target on public.milestones (space_id, target_date) where target_date is not null;

create or replace function public.list_calendar(target_space uuid, from_date date, to_date date, tz text)
returns table (
  kind text, id uuid, title text, all_day boolean, starts_at timestamptz, ends_at timestamptz,
  start_date date, end_date date, idea_id uuid, status text, my_rsvp public.event_rsvp
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare from_ts timestamptz; to_ts timestamptz;
begin
  if not public.is_space_member(target_space) then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  if from_date is null or to_date is null or to_date < from_date or to_date - from_date > 92 then
    raise exception 'choose a window of up to 92 days' using errcode = '22023';
  end if;
  if tz is null or not public.is_iana_time_zone(tz) then
    raise exception 'unknown time zone %', tz using errcode = '22023';
  end if;
  from_ts := from_date::timestamp at time zone tz;
  to_ts := (to_date + 1)::timestamp at time zone tz;
  return query
  select u.kind, u.id, u.title, u.all_day, u.starts_at, u.ends_at, u.start_date, u.end_date,
    u.idea_id, u.status, u.my_rsvp
  from (
    select 'event' kind, e.id, e.title, e.all_day, e.starts_at, e.ends_at, e.start_date, e.end_date,
      e.idea_id, null::text status, a.rsvp my_rsvp
    from public.calendar_events e
    left join public.calendar_event_attendees a on a.event_id = e.id and a.user_id = (select auth.uid())
    where e.space_id = target_space and (
      (not e.all_day and e.starts_at >= from_ts - interval '14 days' and e.starts_at < to_ts
        and (e.ends_at > from_ts or e.starts_at >= from_ts))
      or (e.all_day and not e.repeats_yearly and e.start_date between from_date - 30 and to_date
        and e.end_date >= from_date))
    union all
    select 'occasion', e.id, e.title, true, null, null, o.on_day, o.on_day, e.idea_id, null, a.rsvp
    from public.calendar_events e
    cross join lateral (select (e.start_date
        + make_interval(years => y - extract(year from e.start_date)::integer))::date as on_day
      from generate_series(extract(year from from_date)::integer, extract(year from to_date)::integer) y) o
    left join public.calendar_event_attendees a on a.event_id = e.id and a.user_id = (select auth.uid())
    where e.space_id = target_space and e.repeats_yearly
      and o.on_day between from_date and to_date and o.on_day >= e.start_date
    union all
    select 'task', t.id, t.title, true, null, null, t.due_date, t.due_date, t.idea_id, t.status::text, null
    from public.tasks t
    where t.space_id = target_space and t.due_date between from_date and to_date
    union all
    select 'milestone', m.id, m.title, true, null, null, m.target_date, m.target_date, m.idea_id,
      case when m.completed_at is null then 'open' else 'done' end, null
    from public.milestones m
    where m.space_id = target_space and m.target_date between from_date and to_date
  ) u
  order by coalesce(u.starts_at at time zone tz, u.start_date::timestamp), u.all_day desc, u.title, u.id
  limit 1000;
end;
$$;

grant execute on function public.list_calendar(uuid, date, date, text) to authenticated;
