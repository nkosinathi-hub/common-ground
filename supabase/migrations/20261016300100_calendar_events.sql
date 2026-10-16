-- Calendar events (ADR 0008). Timed events are instants (starts_at, ends_at); all-day events are
-- dates (start_date, end_date inclusive). time_zone is for display and anchors all-day reminders.
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  location text not null default '' check (char_length(location) <= 300),
  all_day boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  start_date date,
  end_date date,
  time_zone text not null,
  repeats_yearly boolean not null default false,
  watch_item_id uuid,
  idea_id uuid,
  task_id uuid,
  default_reminders smallint[] not null default '{}',
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id),
  constraint calendar_events_when check (
    (all_day and start_date is not null and end_date between start_date and start_date + 30
      and starts_at is null and ends_at is null)
    or (not all_day and starts_at is not null
      and ends_at between starts_at and starts_at + interval '14 days'
      and start_date is null and end_date is null)),
  constraint calendar_events_yearly check (not repeats_yearly or (all_day and end_date = start_date)),
  constraint calendar_events_one_link check (num_nonnulls(watch_item_id, idea_id, task_id) <= 1),
  constraint calendar_events_reminders check (cardinality(default_reminders) <= 3
    and default_reminders <@ '{0,5,10,15,30,60,120,1440,2880,10080}'::smallint[]),
  foreign key (space_id, watch_item_id) references public.watch_items (space_id, id)
    on delete set null (watch_item_id),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete set null (idea_id),
  foreign key (space_id, task_id) references public.tasks (space_id, id) on delete set null (task_id)
);

create index calendar_events_timed on public.calendar_events (space_id, starts_at) where not all_day;
create index calendar_events_all_day on public.calendar_events (space_id, start_date)
  where all_day and not repeats_yearly;
create index calendar_events_yearly on public.calendar_events (space_id) where repeats_yearly;

create trigger calendar_events_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- IANA names only: abbreviations such as EST and POSIX strings are not zones people live in.
create or replace function public.calendar_events_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names z
    where z.name = new.time_zone and z.name ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)*$'
      and z.name !~ '^(Etc/|posix/|right/)' and z.name not in ('EST', 'MST', 'HST')) then
    raise exception 'unknown time zone %', new.time_zone using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger calendar_events_validate before insert or update of time_zone
  on public.calendar_events for each row execute function public.calendar_events_validate();

alter table public.calendar_events enable row level security;
create policy calendar_events_select on public.calendar_events for select to authenticated
  using (public.is_space_member(space_id));
create policy calendar_events_insert on public.calendar_events for insert to authenticated
  with check (public.is_space_member(space_id));
create policy calendar_events_update on public.calendar_events for update to authenticated
  using (public.is_space_member(space_id)) with check (public.is_space_member(space_id));
create policy calendar_events_delete on public.calendar_events for delete to authenticated
  using (public.is_space_member(space_id)
    and (created_by = (select auth.uid()) or public.is_space_owner(space_id)));

revoke all on public.calendar_events from anon, authenticated;
grant select, delete on public.calendar_events to authenticated;
grant insert (id, space_id, title, description, location, all_day, starts_at, ends_at, start_date,
  end_date, time_zone, repeats_yearly, watch_item_id, idea_id, task_id, default_reminders),
  update (title, description, location, all_day, starts_at, ends_at, start_date, end_date,
  time_zone, repeats_yearly, watch_item_id, idea_id, task_id, default_reminders)
  on public.calendar_events to authenticated;
