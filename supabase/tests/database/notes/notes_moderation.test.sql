-- Editing, deleting and limits: authors manage their own notes, the owner tidies everyone notes.
begin;
select plan(13);
select tests.notes_setup();
create temp table n (k text primary key, id uuid);
grant select on n to authenticated;
insert into n values ('ben_all', tests.post_note('nt_ben', null, 'Ben to all')),
  ('ben_cat', tests.post_note('nt_ben', 'nt_cat', 'Ben to Cat')),
  ('cat_all', tests.post_note('nt_cat', null, 'Cat to all'));
select tests.act_as('nt_cat');
select public.reply_to_note((select id from n where k = 'ben_all'), 'Cat reply');
select tests.act_as('nt_ana');
select public.reply_to_note((select id from n where k = 'ben_all'), 'Ana reply');

select tests.act_as('nt_cat');
update public.space_notes set body = 'Edited' where id = (select id from n where k = 'ben_all');
select is((select body from public.space_notes where id = (select id from n where k = 'ben_all')),
  'Ben to all', 'only the author edits a note');
select throws_ok($$ update public.space_notes set recipient_id = null
  where id = (select id from n where k = 'cat_all') $$, '42501', null, 'the recipient is fixed');
select throws_ok($$ update public.space_notes set expires_at = created_at + interval '100 days'
  where id = (select id from n where k = 'cat_all') $$, '23514', null, 'expiry stays within 90 days');
delete from public.space_note_replies where body = 'Ana reply';
select is((select count(*)::int from public.space_note_replies), 2, 'not someone else''s reply');
delete from public.space_note_replies where body = 'Cat reply';
select is((select count(*)::int from public.space_note_replies), 1, 'repliers delete their reply');

select tests.act_as('nt_ben');
update public.space_notes set pinned = true, body = 'Ben pinned'
  where id = (select id from n where k = 'ben_all');
select is((select (pinned, body)::text from public.space_notes
  where id = (select id from n where k = 'ben_all')), '(t,"Ben pinned")', 'the author edits and pins');
delete from public.space_note_replies;
select is((select count(*)::int from public.space_note_replies), 0,
  'the note author removes replies on their note');

select tests.act_as('nt_ana');
delete from public.space_notes where id in (select id from n where k in ('ben_cat', 'cat_all'));
select tests.reset_role();
select is((select array_agg(k order by k) from n join public.space_notes s using (id)),
  array['ben_all', 'ben_cat'], 'the owner deletes everyone notes but cannot see private ones');
select tests.act_as('nt_ben');
delete from public.space_notes where id = (select id from n where k = 'ben_cat');
select is((select count(*)::int from public.space_notes), 1, 'authors delete their own notes');

select tests.reset_role();
insert into public.space_notes (space_id, author_id, body)
  select 'e7000000-0000-4000-8000-000000000001', tests.user_id('nt_cat'), 'n' || g
  from generate_series(1, 30) g;
select tests.act_as('nt_cat');
select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001', null,
  'One more', false, null) $$, 'P0001', 'slow down: at most 30 notes a day', 'thirty notes a day');
select tests.reset_role();
insert into public.space_note_replies (space_id, note_id, author_id, body)
  select 'e7000000-0000-4000-8000-000000000001', (select id from n where k = 'ben_all'),
    tests.user_id('nt_cat'), 'r' || g from generate_series(1, 200) g;
select tests.act_as('nt_ben');
select throws_ok($$ select public.reply_to_note((select id from n where k = 'ben_all'), 'More') $$,
  'P0001', null, 'a thread holds at most 200 replies');

select tests.act_as('nt_eve');
delete from public.space_notes;
select tests.reset_role();
select is((select count(*)::int from public.space_notes where body like 'n%'), 30,
  'nonmembers delete nothing');
select tests.act_as('nt_ben');
select throws_ok($$ insert into public.space_notes (space_id, body) values
  ('e7000000-0000-4000-8000-000000000001', 'x') $$, '42501', null, 'notes are posted through the RPC');

select * from finish();
rollback;
