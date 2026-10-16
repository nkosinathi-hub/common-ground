-- Attendees who have not declined hear when an event moves or is cancelled.
begin;
select plan(5);
select tests.calendar_setup();
create temp table ev (k text primary key, id uuid);
grant select on ev to authenticated;
insert into ev values ('party', tests.cal_event('cal_ana', 'Party', '2027-03-01 18:00+02', 120));
select tests.act_as('cal_ana');
select public.set_event_attendees((select id from ev), array[tests.user_id('cal_ben'), tests.user_id('cal_cat')]);
select tests.act_as('cal_cat');
select public.rsvp_event((select id from ev), 'declined');
create function pg_temp.told(kind text) returns text[] language sql as $$
  select coalesce(array_agg(replace(u.email, '@test.local', '') order by u.email), '{}')
  from public.notifications n join auth.users u on u.id = n.recipient_id
  where n.type = kind and n.subject_type = 'calendar_event' $$;

select tests.act_as('cal_ana');
update public.calendar_events set description = 'Bring snacks' where id = (select id from ev);
select tests.reset_role();
select is(pg_temp.told('event_updated'), '{}', 'a new description is not news');
select tests.act_as('cal_ana');
update public.calendar_events set location = 'Park' where id = (select id from ev);
select tests.reset_role();
select is(pg_temp.told('event_updated'), array['cal_ben'],
  'a move tells attendees who have not declined, not the editor');
select tests.act_as('cal_ben');
delete from public.calendar_events where id = (select id from ev);
select tests.act_as('cal_ana');
delete from public.calendar_events where id = (select id from ev);
select tests.reset_role();
select is(pg_temp.told('event_cancelled'), array['cal_ben'], 'cancelling tells attendees');

insert into ev values ('picnic', tests.cal_event('cal_ben', 'Picnic', null, 0, '2027-03-05'));
select set_config('request.jwt.claims', '', true);
delete from public.notifications;
delete from public.spaces where id = 'ca000000-0000-4000-8000-000000000001';
select is(pg_temp.told('event_cancelled'), '{}', 'deleting the space cancels nothing loudly');
select is((select count(*)::int from public.calendar_events), 0, 'and removes its events');

select * from finish();
rollback;
