-- send_note_draft turns a draft into a "Something on my mind" note, and the note's shape holds.
begin;
select plan(17);
select tests.notes_setup();
create temp table d (k text primary key, id uuid);
grant select on d to authenticated;
insert into d values ('ok', tests.draft('nt_ana', 'nt_ben',
  '{"happened": " I keep thinking about Sunday ", "feel": "  ", "matters": ""}')),
  ('empty', tests.draft('nt_ana', 'nt_ben', '{"feel": "   "}')),
  ('cats', tests.draft('nt_cat', 'nt_ben', '{"feel": "tired"}')),
  ('gone', tests.draft('nt_ana', 'nt_cat', '{"feel": "torn"}'));
update public.space_note_drafts set response_wish = 'talk', support_wish = 'listen'
  where id = (select id from d where k = 'ok');

select throws_ok($$ select public.send_note_draft((select id from d where k = 'ok')) $$,
  '28000', null, 'signed out callers cannot send');
select tests.act_as('nt_ana');
select throws_ok($$ select public.send_note_draft((select id from d where k = 'cats')) $$,
  'P0002', null, 'nobody sends someone else''s draft');
select throws_ok($$ select public.send_note_draft((select id from d where k = 'empty')) $$,
  'P0001', null, 'a draft needs words in at least one part');
select tests.reset_role();
delete from public.space_members where user_id = tests.user_id('nt_cat');
select tests.act_as('nt_ana');
select throws_ok($$ select public.send_note_draft((select id from d where k = 'gone')) $$,
  'P0001', null, 'nor without a recipient who is still a member');

create temp table sent as select * from public.send_note_draft((select id from d where k = 'ok'));
select is((select kind::text from sent), 'hard_talk', 'sending creates the note');
select is((select sections from sent), '{"happened": "I keep thinking about Sunday"}'::jsonb,
  'with blank parts left out and the rest trimmed');
select is((select array[body, response_wish::text, support_wish::text] from sent),
  array['', 'talk', 'listen'], 'with the wishes and no body');
select tests.reset_role();
select is((select count(*)::int from public.space_note_drafts where id = (select id from d
  where k = 'ok')), 0, 'the draft is gone once sent');
select is((select array_agg(recipient_id) from public.notifications where type = 'hard_talk'
  and deduplication_key = 'hard_talk:' || (select id from sent)), array[tests.user_id('nt_ben')],
  'only the recipient is notified, once');
select is((select count(*)::int from public.space_note_reads where note_id = (select id from sent)
  and user_id = tests.user_id('nt_ana')), 1, 'the author has read it');
select is((select count(*)::int from public.activity_events where subject_id = (select id from sent)
  and visible_to is null), 0,
  'nothing goes to the space-wide feed');

select throws_ok($$ insert into public.space_notes (space_id, author_id, recipient_id, body,
  kind, sections, response_wish) values ('e7000000-0000-4000-8000-000000000001',
  tests.user_id('nt_ana'), tests.user_id('nt_ben'), 'text', 'hard_talk', '{"feel": "x"}', 'any') $$,
  '23514', null, 'a hard_talk note keeps no body');
select throws_ok($$ insert into public.space_notes (space_id, author_id, recipient_id, body,
  kind, sections, response_wish) values ('e7000000-0000-4000-8000-000000000001',
  tests.user_id('nt_ana'), null, '', 'hard_talk', '{"feel": "x"}', 'any') $$,
  '23514', null, 'and always has a recipient');
select throws_ok($$ insert into public.space_notes (space_id, author_id, body, sections) values
  ('e7000000-0000-4000-8000-000000000001', tests.user_id('nt_ana'), 'Hi', '{"feel": "x"}') $$,
  '23514', null, 'a plain note has no sections');
select throws_ok($$ update public.space_notes set pinned = true where kind = 'hard_talk' $$,
  '23514', null, 'a hard_talk note is never pinned');

select tests.act_as('nt_ana');
update public.space_notes set body = 'Edited', expires_at = now() + interval '1 day';
select tests.reset_role();
select is((select body from public.space_notes where id = (select id from sent)), '',
  'nobody edits it after sending');
select tests.act_as('nt_ana');
select is((select count(*)::int from public.space_notes s where s.id = (select id from sent)
  and s.expires_at is null), 1, 'and it never expires');

select * from finish();
rollback;
