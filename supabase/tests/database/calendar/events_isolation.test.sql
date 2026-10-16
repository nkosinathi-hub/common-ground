-- Events belong to one space: members read and edit; the author or the owner deletes.
begin;
select plan(8);
select tests.calendar_setup();
create temp table ev (k text primary key, id uuid);
grant select on ev to authenticated;
insert into ev values ('ana', tests.cal_event('cal_ana', 'Ana party', '2027-03-01 18:00+02', 60)),
  ('ben', tests.cal_event('cal_ben', 'Ben dinner', '2027-03-02 18:00+02', 60)),
  ('cat', tests.cal_event('cal_cat', 'Cat lunch', '2027-03-03 12:00+02', 60));

select tests.act_as('cal_eve');
select is((select count(*)::int from public.calendar_events), 0, 'a nonmember sees no events');
select is((select count(*)::int from public.calendar_event_attendees), 0, 'nor attendees');
select throws_ok($$ insert into public.calendar_events (space_id, title, time_zone, starts_at, ends_at)
  values ('ca000000-0000-4000-8000-000000000001', 'X', 'UTC', now(), now()) $$, '42501', null,
  'nor adds events to another space');
update public.calendar_events set title = 'Hacked';
delete from public.calendar_events;
select tests.act_as_anon();
select throws_ok($$ select count(*) from public.calendar_events $$, '42501', null, 'anon has no access');

select tests.act_as('cal_ben');
delete from public.calendar_events where id = (select id from ev where k = 'ana');
select is((select count(*)::int from public.calendar_events where title <> 'Hacked'), 3,
  'members cannot delete someone else''s event; nonmembers changed nothing');
delete from public.calendar_events where id = (select id from ev where k = 'ben');
select is((select count(*)::int from public.calendar_events), 2, 'authors delete their own events');
select tests.act_as('cal_ana');
delete from public.calendar_events where id = (select id from ev where k = 'cat');
select is((select count(*)::int from public.calendar_events), 1, 'the owner deletes any event');
select throws_ok($$ update public.calendar_events set space_id = 'ca000000-0000-4000-8000-000000000002' $$,
  '42501', null, 'events cannot move between spaces');

select * from finish();
rollback;
