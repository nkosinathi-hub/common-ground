-- Personal reminders. remind_at is precomputed so delivery is one indexed scan.
create table public.calendar_event_reminders (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  event_id uuid not null,
  user_id uuid not null default auth.uid(),
  minutes_before smallint not null
    check (minutes_before in (0, 5, 10, 15, 30, 60, 120, 1440, 2880, 10080)),
  remind_at timestamptz not null,
  sent_at timestamptz,
  unique (event_id, user_id, minutes_before),
  foreign key (space_id, event_id) references public.calendar_events (space_id, id) on delete cascade,
  foreign key (space_id, user_id) references public.space_members (space_id, user_id)
    on delete cascade
);
create index calendar_event_reminders_due on public.calendar_event_reminders (remind_at)
  where sent_at is null;
create index calendar_event_reminders_user on public.calendar_event_reminders (space_id, user_id);

alter table public.calendar_event_reminders enable row level security;
create policy calendar_event_reminders_select on public.calendar_event_reminders
  for select to authenticated
  using (user_id = (select auth.uid()) and public.is_space_member(space_id));
revoke all on public.calendar_event_reminders from anon, authenticated;
grant select on public.calendar_event_reminders to authenticated;

-- Internal. The reminder time for an event: starts_at for timed events, 09:00 local on the start
-- date for all-day ones. A yearly occasion uses its first occurrence whose reminder is not before
-- `after` (29 February falls on 28 February in other years).
create or replace function public.next_remind_at(event uuid, minutes integer, after timestamptz)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare e public.calendar_events; anchor timestamptz; n integer := 0;
begin
  select * into e from public.calendar_events where id = event;
  if not e.all_day then return e.starts_at - make_interval(mins => minutes); end if;
  if e.repeats_yearly then
    n := greatest(0, extract(year from after at time zone e.time_zone)::integer
      - extract(year from e.start_date)::integer - 1);
  end if;
  loop
    anchor := ((e.start_date + make_interval(years => n))::date + time '09:00')
      at time zone e.time_zone;
    exit when not e.repeats_yearly or anchor - make_interval(mins => minutes) >= after;
    n := n + 1;
  end loop;
  return anchor - make_interval(mins => minutes);
end;
$$;

-- Internal. Adds the event's default reminders for one person, keeping any they already have.
create or replace function public.add_default_reminders(event uuid, member uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.calendar_event_reminders (space_id, event_id, user_id, minutes_before, remind_at)
  select e.space_id, e.id, member, m, public.next_remind_at(e.id, m, now())
  from public.calendar_events e, unnest(e.default_reminders) m where e.id = event
  on conflict (event_id, user_id, minutes_before) do nothing;
$$;

create or replace function public.set_my_event_reminders(event uuid, minutes smallint[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid()); target public.calendar_events;
begin
  select * into target from public.calendar_events e where e.id = event
    and public.is_space_member(e.space_id);
  if target.id is null then raise exception 'event not found' using errcode = 'P0002'; end if;
  minutes := coalesce(minutes, '{}');
  if cardinality(minutes) > 3 or not minutes <@ '{0,5,10,15,30,60,120,1440,2880,10080}'::smallint[] then
    raise exception 'choose up to three of the offered reminders' using errcode = 'P0001';
  end if;
  delete from public.calendar_event_reminders r
  where r.event_id = target.id and r.user_id = caller and r.minutes_before <> all (minutes);
  insert into public.calendar_event_reminders (space_id, event_id, user_id, minutes_before, remind_at)
  select target.space_id, target.id, caller, m, public.next_remind_at(target.id, m, now())
  from (select distinct unnest(minutes) m) s
  on conflict (event_id, user_id, minutes_before) do nothing;
end;
$$;

revoke execute on function public.next_remind_at(uuid, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.add_default_reminders(uuid, uuid) from public, anon, authenticated;
grant execute on function public.set_my_event_reminders(uuid, smallint[]) to authenticated;
