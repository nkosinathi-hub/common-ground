-- Runs before this folder's tests and is not rolled back.
-- cal_ana owns "Us" (ca..01) with cal_ben and cal_cat; cal_eve owns "Other" (ca..02).
-- Us holds a title (..21), an idea (..31) with a task (..41) and a milestone (..51);
-- Other holds an idea (..32).
create or replace function tests.calendar_setup() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform tests.create_user(h) from unnest(array['cal_ana', 'cal_ben', 'cal_cat', 'cal_eve']) h;
  insert into public.spaces (id, name) values
    ('ca000000-0000-4000-8000-000000000001', 'Us'), ('ca000000-0000-4000-8000-000000000002', 'Other');
  insert into public.space_members (space_id, user_id, role) values
    ('ca000000-0000-4000-8000-000000000001', tests.user_id('cal_ana'), 'owner'),
    ('ca000000-0000-4000-8000-000000000001', tests.user_id('cal_ben'), 'member'),
    ('ca000000-0000-4000-8000-000000000001', tests.user_id('cal_cat'), 'member'),
    ('ca000000-0000-4000-8000-000000000002', tests.user_id('cal_eve'), 'owner');
  insert into public.watch_items (id, space_id, title, media_type) values
    ('ca000000-0000-4000-8000-000000000021', 'ca000000-0000-4000-8000-000000000001', 'Dune', 'movie');
  insert into public.ideas (id, space_id, title) values
    ('ca000000-0000-4000-8000-000000000031', 'ca000000-0000-4000-8000-000000000001', 'Cafe'),
    ('ca000000-0000-4000-8000-000000000032', 'ca000000-0000-4000-8000-000000000002', 'Bakery');
  insert into public.tasks (id, space_id, idea_id, title, due_date, status) values
    ('ca000000-0000-4000-8000-000000000041', 'ca000000-0000-4000-8000-000000000001',
     'ca000000-0000-4000-8000-000000000031', 'Sign lease', '2027-03-10', 'todo');
  insert into public.milestones (id, space_id, idea_id, title, target_date, completed_at) values
    ('ca000000-0000-4000-8000-000000000051', 'ca000000-0000-4000-8000-000000000001',
     'ca000000-0000-4000-8000-000000000031', 'Opening', '2027-03-20', now());
end $$;

-- Creates an event in Us as the given user (timed when starts is given, else all-day).
create or replace function tests.cal_event(
  author text, title text, starts timestamptz, minutes int, day date default null,
  zone text default 'Africa/Johannesburg', yearly boolean default false,
  reminders smallint[] default '{}'
) returns uuid
language plpgsql set search_path = '' as $$
declare created uuid;
begin
  perform tests.act_as(author);
  insert into public.calendar_events (space_id, title, all_day, starts_at, ends_at, start_date,
    end_date, time_zone, repeats_yearly, default_reminders)
  values ('ca000000-0000-4000-8000-000000000001', title, starts is null, starts,
    starts + make_interval(mins => minutes), day, day, zone, yearly, reminders)
  returning id into created;
  perform tests.reset_role();
  return created;
end $$;

grant execute on function tests.cal_event(text, text, timestamptz, int, date, text, boolean, smallint[])
  to authenticated;

select plan(1);
select pass('calendar fixtures installed');
select * from finish();
