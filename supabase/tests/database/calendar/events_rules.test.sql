-- Event shape: timed events are instants, all-day events are dates; zones are IANA names.
begin;
select plan(18);
select tests.calendar_setup();
create function pg_temp.ins(cols text, vals text) returns void language plpgsql as $$
begin
  execute format('insert into public.calendar_events (space_id, title, time_zone, %s) values '
    '(''ca000000-0000-4000-8000-000000000001'', ''E'', ''Africa/Johannesburg'', %s)', cols, vals);
end $$;
select tests.act_as('cal_ben');

select lives_ok($$ select pg_temp.ins('starts_at, ends_at, location, idea_id',
  '''2027-03-01 18:00+02'', ''2027-03-01 20:00+02'', ''Home'', ''ca000000-0000-4000-8000-000000000031''') $$,
  'a member adds a timed event linked to an idea');
select lives_ok($$ select pg_temp.ins('all_day, start_date, end_date', 'true, ''2027-03-01'', ''2027-03-03''') $$,
  'and a three-day all-day event');
select is((select (created_by = tests.user_id('cal_ben'))::text || ',' || a.rsvp from public.calendar_events e
  join public.calendar_event_attendees a on a.event_id = e.id and a.user_id = e.created_by
  where e.location = 'Home'), 'true,going', 'the creator attends');
select throws_ok($$ insert into public.calendar_events (space_id, title, time_zone, starts_at, ends_at)
  values ('ca000000-0000-4000-8000-000000000001', 'E', 'EST', now(), now()) $$, '22023', null,
  'abbreviations are not zones');
select throws_ok($$ insert into public.calendar_events (space_id, title, time_zone, starts_at, ends_at)
  values ('ca000000-0000-4000-8000-000000000001', 'E', 'Mars/Base', now(), now()) $$, '22023', null,
  'unknown zones are rejected');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at', 'now(), now() - interval ''1 minute''') $$,
  '23514', null, 'an event ends after it starts');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at', 'now(), now() + interval ''15 days''') $$,
  '23514', null, 'timed events last at most 14 days');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at, start_date, end_date',
  'now(), now(), current_date, current_date') $$, '23514', null, 'timed events carry no dates');
select throws_ok($$ select pg_temp.ins('all_day, start_date, end_date', 'true, ''2027-03-01'', ''2027-04-01''') $$,
  '23514', null, 'all-day events last at most 31 days');
select throws_ok($$ select pg_temp.ins('all_day, start_date, end_date, repeats_yearly',
  'true, ''2027-03-01'', ''2027-03-02'', true') $$, '23514', null, 'yearly occasions are one day');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at, repeats_yearly', 'now(), now(), true') $$,
  '23514', null, 'yearly occasions are all-day');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at, idea_id, task_id', 'now(), now(), '
  '''ca000000-0000-4000-8000-000000000031'', ''ca000000-0000-4000-8000-000000000041''') $$,
  '23514', null, 'one link at most');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at, default_reminders', 'now(), now(), ''{7}''') $$,
  '23514', null, 'reminders use the offered offsets');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at, default_reminders', 'now(), now(), ''{0,5,10,15}''') $$,
  '23514', null, 'three reminders at most');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at, idea_id',
  'now(), now(), ''ca000000-0000-4000-8000-000000000032''') $$, '23503', null,
  'links stay inside the space');
select throws_ok($$ select pg_temp.ins('starts_at, ends_at, created_by',
  'now(), now(), tests.user_id(''cal_ana'')') $$, '42501', null, 'the author cannot be forged');

select tests.reset_role();
delete from public.ideas where id = 'ca000000-0000-4000-8000-000000000031';
select is((select idea_id from public.calendar_events where location = 'Home'), null,
  'deleting a linked idea keeps the event and clears the link');
select tests.act_as('cal_ben');
update public.calendar_events set time_zone = 'Europe/London' where location = 'Home';
select is((select time_zone from public.calendar_events where location = 'Home'), 'Europe/London',
  'a member edits an event');

select * from finish();
rollback;
