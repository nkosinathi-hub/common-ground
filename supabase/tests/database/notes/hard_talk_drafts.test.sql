-- "Something on my mind" drafts: only their author ever sees them, at most 5 per space.
begin;
select plan(14);
select tests.notes_setup();
create temp table d (k text primary key, id uuid);
grant select on d to authenticated;
insert into d values ('ben', tests.draft('nt_ana', 'nt_ben', '{}'));

select tests.act_as('nt_ana');
select is((select count(*)::int from public.space_note_drafts), 1,
  'an empty draft saves, and its author sees it');
update public.space_note_drafts set sections = '{"happened": "I keep thinking about it"}',
  response_wish = 'talk', support_wish = 'listen';
select is((select sections ->> 'happened' from public.space_note_drafts), 'I keep thinking about it',
  'the author updates their draft');
select throws_ok($$ update public.space_note_drafts set sections = '{"other": "x"}' $$,
  '23514', null, 'only the four sections are kept');
select throws_ok($$ update public.space_note_drafts set sections = jsonb_build_object('feel',
  repeat('x', 501)) $$, '23514', null, 'each section is at most 500 characters');
select throws_ok($$ insert into public.space_note_drafts (space_id, recipient_id) values
  ('e7000000-0000-4000-8000-000000000001', tests.user_id('nt_ana')) $$, '23514', null,
  'a draft is never to yourself');
select throws_ok($$ insert into public.space_note_drafts (space_id, author_id) values
  ('e7000000-0000-4000-8000-000000000001', tests.user_id('nt_ben')) $$, '42501', null,
  'nor written as someone else');

select tests.act_as('nt_ben');
select is((select count(*)::int from public.space_note_drafts), 0, 'the recipient sees no draft');
update public.space_note_drafts set sections = '{"feel": "hijacked"}';
select tests.act_as('nt_cat');
select is((select count(*)::int from public.space_note_drafts), 0, 'nor does anyone else');
delete from public.space_note_drafts;
select tests.act_as('nt_eve');
select throws_ok($$ insert into public.space_note_drafts (space_id) values
  ('e7000000-0000-4000-8000-000000000001') $$, '42501', null, 'nonmembers cannot draft');
select tests.reset_role();
select is((select sections ->> 'happened' from public.space_note_drafts where id =
  (select id from d where k = 'ben')), 'I keep thinking about it',
  'others can neither change nor delete it');
select is((select count(*)::int from public.notifications
  where space_id = 'e7000000-0000-4000-8000-000000000001'), 0,
  'drafting notifies nobody');

select tests.draft('nt_ana', 'nt_cat', '{}') from generate_series(1, 4);
select throws_ok($$ select tests.draft('nt_ana', 'nt_cat', '{}') $$, 'P0001',
  'You have 5 drafts already', 'at most 5 drafts per person per space');

delete from public.space_members where user_id = tests.user_id('nt_ben');
select is((select recipient_id from public.space_note_drafts where id = (select id from d
  where k = 'ben')), null, 'a draft stays, without a recipient, when they leave');
select tests.draft('nt_cat', 'nt_ana', '{}');
delete from public.space_members where user_id = tests.user_id('nt_cat');
select is((select count(*)::int from public.space_note_drafts where author_id =
  tests.user_id('nt_cat')), 0,
  'leaving the space removes the author''s drafts');

select * from finish();
rollback;
