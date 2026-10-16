-- respond_to_note: the recipient's gentle responses, private reminders and who sees what.
begin;
select plan(17);
select tests.notes_setup();
create temp table n (k text primary key, id uuid);
grant select on n to authenticated;
insert into n values ('ht', tests.hard_talk('nt_ana', 'nt_ben')),
  ('plain', tests.post_note('nt_ana', 'nt_ben', 'Plain'));
create function pg_temp.count_of(handle text, kind text) returns int language sql as $$
  select count(*)::int from public.notifications where recipient_id = tests.user_id(handle)
    and type = kind $$;

select tests.act_as('nt_ana');
select throws_ok($$ select public.respond_to_note((select id from n where k = 'ht'), 'here', null) $$,
  '42501', null, 'the author cannot respond to their own note');
select tests.act_as('nt_cat');
select throws_ok($$ select public.respond_to_note((select id from n where k = 'ht'), 'here', null) $$,
  'P0002', null, 'a third member cannot find it');
select tests.act_as('nt_ben');
select throws_ok($$ select public.respond_to_note((select id from n where k = 'plain'), 'here',
  null) $$, 'P0001', null, 'only "Something on my mind" notes take gentle responses');
select throws_ok($$ select public.respond_to_note((select id from n where k = 'ht'), 'time', 2) $$,
  '22023', null, 'a reminder is in 1 or 3 days');
select throws_ok($$ select public.respond_to_note((select id from n where k = 'ht'), 'here', 1) $$,
  '22023', null, 'and only after "I need a little time"');

select is((public.respond_to_note((select id from n where k = 'ht'), 'time', 3)).kind::text, 'time',
  'the recipient responds');
select is((select count(*)::int from public.space_note_reads where note_id = (select id from n
  where k = 'ht')), 1, 'responding reads the note');
select ok((select remind_at between now() + interval '71 hours' and now() + interval '73 hours'
  from public.space_note_nudges), 'and asks for a reminder in 3 days, which they can see');
select tests.reset_role();
select is(pg_temp.count_of('nt_ana', 'note_response'), 1, 'the author hears about the response');

select tests.act_as('nt_ana');
select is((select array_agg(kind::text) from public.space_note_responses), array['time'],
  'the author sees the response');
select is((select count(*)::int from public.space_note_nudges), 0, 'but never the reminder');
select tests.act_as('nt_cat');
select is((select count(*)::int from public.space_note_responses) +
  (select count(*)::int from public.space_notes), 0, 'a third member sees neither note nor response');

select tests.reset_role();
update public.space_note_nudges set remind_at = now() - interval '1 minute'
  where note_id = (select id from n where k = 'ht');
select public.deliver_note_nudges();
select ok((select sent_at is not null from public.space_note_nudges
  where note_id = (select id from n where k = 'ht')), 'a due reminder is delivered');
select public.deliver_note_nudges();
select is(pg_temp.count_of('nt_ben', 'note_nudge'), 1, 'once');
select is(pg_temp.count_of('nt_ana', 'note_nudge'), 0, 'to the reader only');

select tests.act_as('nt_ben');
select public.respond_to_note((select id from n where k = 'ht'), 'time', 1);
select public.respond_to_note((select id from n where k = 'ht'), 'thanks', null);
select tests.reset_role();
update public.space_note_nudges set remind_at = now() - interval '1 minute'
  where sent_at is null and note_id = (select id from n where k = 'ht');
select public.deliver_note_nudges();
select is(pg_temp.count_of('nt_ben', 'note_nudge'), 1,
  'a reminder is skipped once they have responded warmly');
insert into public.space_note_responses (space_id, note_id, author_id, kind)
  select 'e7000000-0000-4000-8000-000000000001', (select id from n where k = 'ht'),
  tests.user_id('nt_ben'), 'here' from generate_series(1, 17);
select tests.act_as('nt_ben');
select throws_ok($$ select public.respond_to_note((select id from n where k = 'ht'), 'here', null) $$,
  'P0001', null, 'at most 20 responses');

select * from finish();
rollback;
