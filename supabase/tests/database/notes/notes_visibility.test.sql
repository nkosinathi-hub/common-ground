-- A note is seen by its recipient and author, or by every member when addressed to everyone.
begin;
select plan(10);
select tests.notes_setup();
create temp table n (k text primary key, id uuid);
grant select on n to authenticated;
insert into n values ('direct', tests.post_note('nt_ana', 'nt_cat', 'For Cat')),
  ('all', tests.post_note('nt_ben', null, 'For everyone'));
select tests.act_as('nt_cat');
select public.reply_to_note((select id from n where k = 'direct'), 'Thanks');

select tests.act_as('nt_ben');
select is((select array_agg(body order by body) from public.space_notes), array['For everyone'],
  'a member does not see a note addressed to someone else');
select is((select count(*)::int from public.space_note_replies), 0, 'nor its replies');
select throws_ok($$ select public.reply_to_note((select id from n where k = 'direct'), 'Me too') $$,
  'P0002', null, 'nor can they reply to it');
select throws_ok($$ select public.mark_note_read((select id from n where k = 'direct')) $$,
  'P0002', null, 'nor mark it read');

select tests.act_as('nt_cat');
select is((select array_agg(body order by body) from public.space_notes),
  array['For Cat', 'For everyone'], 'the recipient sees their note and the everyone note');
select is((select count(*)::int from public.space_note_replies), 1, 'and the replies');

select tests.act_as('nt_ana');
select is((select count(*)::int from public.space_notes), 2, 'the author sees what they sent');

select tests.act_as('nt_eve');
select is((select count(*)::int from public.space_notes), 0, 'a nonmember sees no notes');
select is((select count(*)::int from public.space_note_reads), 0, 'nor any read state');

select tests.reset_role();
delete from public.space_members where user_id = tests.user_id('nt_cat');
select is((select count(*)::int from public.space_notes where id = (select id from n where k = 'direct')),
  0, 'a note to someone who leaves goes with them');

select * from finish();
rollback;
