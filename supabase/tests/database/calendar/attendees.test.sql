-- Attendees: any member sets the list or answers; invitees and the creator are told.
begin;
select plan(14);
select tests.calendar_setup();
create temp table ev (k text primary key, id uuid);
grant select on ev to authenticated;
insert into ev values ('party', tests.cal_event('cal_ana', 'Party', '2027-03-01 18:00+02', 120,
  reminders => '{60}'));
create function pg_temp.rsvps() returns text language sql as $$
  select string_agg(replace(u.email, '@test.local', '') || '=' || a.rsvp, ',' order by u.email)
  from public.calendar_event_attendees a join auth.users u on u.id = a.user_id
  where a.event_id = (select id from ev) $$;

select tests.act_as('cal_ben');
select lives_ok($$ select public.set_event_attendees((select id from ev),
  array[tests.user_id('cal_ana'), tests.user_id('cal_cat')]) $$, 'a member sets the attendees');
select tests.reset_role();
select is(pg_temp.rsvps(), 'cal_ana=going,cal_ben=going,cal_cat=pending',
  'new attendees are pending, the person editing is going');
select is((select array_agg(replace(u.email, '@test.local', '') order by u.email)
  from public.notifications n join auth.users u on u.id = n.recipient_id
  where n.type = 'event_invite' and n.subject_id = (select id from ev)), array['cal_cat'],
  'new invitees are told; the creator and the editor are not');
select is((select count(*)::int from public.calendar_event_reminders
  where event_id = (select id from ev) and minutes_before = 60), 3,
  'everyone attending gets the default reminders');

select tests.act_as('cal_ben');
select throws_ok($$ select public.set_event_attendees((select id from ev),
  array[tests.user_id('cal_eve')]) $$, 'P0001', null, 'attendees are members');
select throws_ok($$ select public.set_event_attendees((select id from ev),
  (select array_agg(gen_random_uuid()) from generate_series(1, 51))) $$, 'P0001', null,
  'fifty attendees at most');
select throws_ok($$ select public.rsvp_event((select id from ev), 'pending') $$, 'P0001', null,
  'pending is not an answer');
select tests.act_as('cal_cat');
select public.rsvp_event((select id from ev), 'maybe');
select tests.reset_role();
select is((select count(*)::int from public.notifications where type = 'event_rsvp'
  and recipient_id = tests.user_id('cal_ana')), 1, 'the creator hears the answer');

select tests.act_as('cal_eve');
select throws_ok($$ select public.rsvp_event((select id from ev), 'going') $$, '42501', null,
  'nonmembers cannot answer');
select throws_ok($$ select public.set_event_attendees((select id from ev), '{}') $$, '42501', null,
  'nor set attendees');

select tests.act_as('cal_ana');
select public.set_event_attendees((select id from ev), array[tests.user_id('cal_ben')]);
select tests.reset_role();
select is(pg_temp.rsvps(), 'cal_ana=going,cal_ben=going', 'removing an attendee drops their row');
select is((select count(*)::int from public.calendar_event_reminders
  where user_id = tests.user_id('cal_cat')), 0, 'and their reminders');
select tests.act_as('cal_cat');
select public.rsvp_event((select id from ev), 'going');
select tests.reset_role();
select is(pg_temp.rsvps(), 'cal_ana=going,cal_ben=going,cal_cat=going', 'any member may join');
delete from public.space_members where user_id = tests.user_id('cal_cat');
select is(pg_temp.rsvps(), 'cal_ana=going,cal_ben=going', 'leaving the space drops attendance');

select * from finish();
rollback;
