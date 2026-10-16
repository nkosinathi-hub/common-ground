-- list_calendar: one window of events, yearly occasions, task due dates and milestones.
begin;
select plan(9);
select tests.calendar_setup();
select tests.cal_event('cal_ana', 'Span timed', '2027-02-27 20:00+02', 38 * 60);
select tests.cal_event('cal_ana', 'Span day', null, 0, '2027-02-20');
update public.calendar_events set end_date = '2027-03-02' where title = 'Span day';
select tests.cal_event('cal_ana', 'Before', null, 0, '2027-02-01');
update public.calendar_events set end_date = '2027-02-28' where title = 'Before';
select tests.cal_event('cal_ana', 'Late', '2027-03-31 23:30+02', 60);
select tests.cal_event('cal_ana', 'April', '2027-04-01 00:30+02', 60);
select tests.cal_event('cal_ana', 'Feb late', '2027-02-28 23:30+02', 30);
select tests.cal_event('cal_ana', 'Leap', null, 0, '2028-02-29', yearly => true);

select tests.act_as('cal_ana');
select is((select array_agg(kind || ':' || title) from public.list_calendar(
    'ca000000-0000-4000-8000-000000000001', '2027-03-01', '2027-03-31', 'Africa/Johannesburg')),
  array['event:Span day', 'event:Span timed', 'task:Sign lease', 'milestone:Opening', 'event:Late'],
  'spanning events, due tasks and milestones, by local day');
select is((select array_agg(coalesce(status, '-') || ',' || coalesce(my_rsvp::text, '-'))
  from public.list_calendar('ca000000-0000-4000-8000-000000000001', '2027-03-01', '2027-03-31',
    'Africa/Johannesburg')), array['-,going', '-,going', 'todo,-', 'done,-', '-,going'],
  'tasks carry their status, milestones done or open, events my answer');
select is((select array_agg(title) from public.list_calendar('ca000000-0000-4000-8000-000000000001',
    '2027-03-31', '2027-03-31', 'UTC')), array['Late', 'April'],
  'the same instants fall on other days in another zone');
select is((select array_agg(kind || ':' || start_date) from public.list_calendar(
    'ca000000-0000-4000-8000-000000000001', '2029-02-01', '2029-03-31', 'Africa/Johannesburg')),
  array['occasion:2029-02-28'], 'a 29 February occasion shows on 28 February');
select is((select count(*)::int from public.list_calendar('ca000000-0000-4000-8000-000000000001',
    '2027-02-01', '2027-02-27', 'Africa/Johannesburg') where kind = 'occasion'), 0,
  'occasions start on their first date');
select throws_ok($$ select * from public.list_calendar('ca000000-0000-4000-8000-000000000001',
  '2027-01-01', '2027-04-04', 'UTC') $$, '22023', null, 'windows are at most 92 days');
select throws_ok($$ select * from public.list_calendar('ca000000-0000-4000-8000-000000000001',
  '2027-03-02', '2027-03-01', 'UTC') $$, '22023', null, 'windows end after they start');
select throws_ok($$ select * from public.list_calendar('ca000000-0000-4000-8000-000000000001',
  '2027-03-01', '2027-03-31', 'EST') $$, '22023', null, 'the zone is an IANA name');
select tests.act_as('cal_eve');
select throws_ok($$ select * from public.list_calendar('ca000000-0000-4000-8000-000000000001',
  '2027-03-01', '2027-03-31', 'UTC') $$, '42501', null, 'nonmembers see no calendar');

select * from finish();
rollback;
