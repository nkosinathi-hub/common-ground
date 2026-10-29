-- v0.6 calendar (D12 to D14, M05): each row also carries what its card shows. Events give their
-- place and who is coming (everyone invited who has not declined); tasks their assignee, priority
-- and milestone; tasks, milestones and linked events the idea they belong to. The return type
-- changes, so the function is dropped and made again.
drop function if exists public.list_calendar(uuid, date, date, text);

create function public.list_calendar(target_space uuid, from_date date, to_date date, tz text)
returns table (
  kind text, id uuid, title text, all_day boolean, starts_at timestamptz, ends_at timestamptz,
  start_date date, end_date date, idea_id uuid, status text, my_rsvp public.event_rsvp,
  place text, people uuid[], priority text, milestone_title text, idea_title text
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
    u.idea_id, u.status, u.my_rsvp, u.place, u.people, u.priority, u.milestone_title, i.title
  from (
    select 'event' kind, e.id, e.title, e.all_day, e.starts_at, e.ends_at, e.start_date, e.end_date,
      e.idea_id, null::text status, a.rsvp my_rsvp, nullif(e.location, '') place,
      (select coalesce(array_agg(g.user_id order by g.user_id), '{}') from public.calendar_event_attendees g
        where g.event_id = e.id and g.rsvp <> 'declined') people,
      null::text priority, null::text milestone_title
    from public.calendar_events e
    left join public.calendar_event_attendees a on a.event_id = e.id and a.user_id = (select auth.uid())
    where e.space_id = target_space and (
      (not e.all_day and e.starts_at >= from_ts - interval '14 days' and e.starts_at < to_ts
        and (e.ends_at > from_ts or e.starts_at >= from_ts))
      or (e.all_day and not e.repeats_yearly and e.start_date between from_date - 30 and to_date
        and e.end_date >= from_date))
    union all
    select 'occasion', e.id, e.title, true, null, null, o.on_day, o.on_day, e.idea_id, null, a.rsvp,
      nullif(e.location, ''),
      (select coalesce(array_agg(g.user_id order by g.user_id), '{}') from public.calendar_event_attendees g
        where g.event_id = e.id and g.rsvp <> 'declined'),
      null, null
    from public.calendar_events e
    cross join lateral (select (e.start_date
        + make_interval(years => y - extract(year from e.start_date)::integer))::date as on_day
      from generate_series(extract(year from from_date)::integer, extract(year from to_date)::integer) y) o
    left join public.calendar_event_attendees a on a.event_id = e.id and a.user_id = (select auth.uid())
    where e.space_id = target_space and e.repeats_yearly
      and o.on_day between from_date and to_date and o.on_day >= e.start_date
    union all
    select 'task', t.id, t.title, true, null, null, t.due_date, t.due_date, t.idea_id, t.status::text,
      null, null, case when t.assignee_id is null then '{}'::uuid[] else array[t.assignee_id] end,
      t.priority::text, m.title
    from public.tasks t
    left join public.milestones m on m.space_id = t.space_id and m.id = t.milestone_id
    where t.space_id = target_space and t.due_date between from_date and to_date
    union all
    select 'milestone', m.id, m.title, true, null, null, m.target_date, m.target_date, m.idea_id,
      case when m.completed_at is null then 'open' else 'done' end, null, null, '{}'::uuid[], null, null
    from public.milestones m
    where m.space_id = target_space and m.target_date between from_date and to_date
  ) u
  left join public.ideas i on i.space_id = target_space and i.id = u.idea_id
  order by coalesce(u.starts_at at time zone tz, u.start_date::timestamp), u.all_day desc, u.title, u.id
  limit 1000;
end;
$$;

revoke all on function public.list_calendar(uuid, date, date, text) from public, anon;
grant execute on function public.list_calendar(uuid, date, date, text) to authenticated;
