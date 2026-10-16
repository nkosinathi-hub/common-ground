-- Reminders: computed per event kind, delivered once by the cron job, moved with the event.
begin;
select plan(16);
select tests.calendar_setup();
create temp table ev (k text primary key, id uuid);
grant select on ev to authenticated;
insert into ev values
  ('timed', tests.cal_event('cal_ben', 'Dinner', '2027-03-01 18:00+02', 60, reminders => '{30}')),
  ('day', tests.cal_event('cal_ben', 'Picnic', null, 0, '2027-03-05', reminders => '{0}')),
  ('soon', tests.cal_event('cal_ben', 'Soon', now() + interval '10 minutes', 30, reminders => '{30}')),
  ('stale', tests.cal_event('cal_ben', 'Stale', now() - interval '1 hour', 30, reminders => '{60}')),
  ('leap', tests.cal_event('cal_ben', 'Leap', null, 0, '2028-02-29', yearly => true, reminders => '{0}')),
  ('bday', tests.cal_event('cal_ben', 'Bday', null, 0, '2020-06-15', yearly => true, reminders => '{0}'));
create function pg_temp.rem(event text, who text default 'cal_ben') returns public.calendar_event_reminders
language sql as $$ select r.* from public.calendar_event_reminders r join ev on ev.id = r.event_id
  where ev.k = event and r.user_id = tests.user_id(who) $$;

select is((pg_temp.rem('timed')).remind_at, '2027-03-01 15:30Z'::timestamptz, 'timed: 30 minutes before');
select is((pg_temp.rem('day')).remind_at, '2027-03-05 07:00Z'::timestamptz,
  'all-day: 09:00 in the event zone');
select is(public.next_remind_at((select id from ev where k = 'leap'), 0, '2028-03-01'),
  '2029-02-28 07:00Z'::timestamptz, 'a 29 February occasion falls on 28 February');
select tests.act_as('cal_cat');
select public.rsvp_event((select id from ev where k = 'soon'), 'going');
select public.rsvp_event((select id from ev where k = 'soon'), 'declined');
select lives_ok($$ select public.set_my_event_reminders((select id from ev where k = 'timed'), '{5,10}') $$,
  'a member sets their own reminders');
select throws_ok($$ select public.set_my_event_reminders((select id from ev where k = 'timed'), '{7}') $$,
  'P0001', null, 'only the offered offsets');
select is((select count(*)::int from public.calendar_event_reminders), 3,
  'people see only their own reminders');
select throws_ok($$ select public.deliver_event_reminders() $$, '42501', null,
  'clients cannot run delivery');
select tests.act_as('cal_eve');
select throws_ok($$ select public.set_my_event_reminders((select id from ev where k = 'timed'), '{5}') $$,
  'P0002', null, 'nonmembers cannot set reminders');

select tests.reset_role();
update public.calendar_event_reminders set remind_at = now() - interval '5 minutes'
  where event_id = (select id from ev where k = 'bday');
select ok(public.deliver_event_reminders() >= 2, 'due reminders are delivered');
select is((select array_agg(c.title order by c.title) from public.notifications n
  join public.calendar_events c on c.id = n.subject_id where n.type = 'event_reminder'
  and n.subject_type = 'calendar_event' and n.recipient_id = tests.user_id('cal_ben')),
  array['Bday', 'Soon'], 'the creator is reminded; stale reminders are retired unsent');
select is((select count(*)::int from public.notifications where recipient_id = tests.user_id('cal_cat')
  and type = 'event_reminder'), 0, 'people who declined are not reminded');
select ok((pg_temp.rem('soon')).sent_at is not null and (pg_temp.rem('stale')).sent_at is not null,
  'sent and retired reminders are marked');
select ok((pg_temp.rem('bday')).sent_at is null and (pg_temp.rem('bday')).remind_at > now()
  and to_char((pg_temp.rem('bday')).remind_at at time zone 'Africa/Johannesburg', 'MM-DD HH24:MI')
    = '06-15 09:00', 'a yearly reminder moves to the next occurrence');
select public.deliver_event_reminders();
select is((select count(*)::int from public.notifications where type = 'event_reminder'
  and recipient_id = tests.user_id('cal_ben')), 2, 'a reminder is sent once');

select tests.act_as('cal_ben');
update public.calendar_events set starts_at = now() + interval '2 hours', ends_at = now() + interval '3 hours'
  where id = (select id from ev where k = 'soon');
select tests.reset_role();
select ok((pg_temp.rem('soon')).sent_at is null
  and (pg_temp.rem('soon')).remind_at = now() + interval '90 minutes', 'moving an event resets its reminders');
select is((select count(*)::int from cron.job where jobname in ('calendar-reminders',
  'space-notes-expiry', 'cron-history-purge')), 3, 'the cron jobs are scheduled');

select * from finish();
rollback;
