-- post_note, reply_to_note and mark_note_read: rules, notifications and read state.
begin;
select plan(17);
select tests.notes_setup();
create temp table n (k text primary key, id uuid);
grant select on n to authenticated;
create function pg_temp.notes_of(handle text, kind text) returns int language sql as $$
  select count(*)::int from public.notifications where recipient_id = tests.user_id(handle)
    and type = kind and subject_type = 'space_note' $$;

select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001', null, 'Hi',
  false, null) $$, '28000', null, 'signed out callers cannot post');
select tests.act_as('nt_eve');
select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001', null, 'Hi',
  false, null) $$, '42501', null, 'nonmembers cannot post');
select tests.act_as('nt_ana');
select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001', null, '  ',
  false, null) $$, 'P0001', null, 'notes need words');
select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001',
  tests.user_id('nt_ana'), 'Me', false, null) $$, 'P0001', null, 'not to yourself');
select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001',
  tests.user_id('nt_eve'), 'Hi', false, null) $$, 'P0001', null, 'only to members');
select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001', null, 'Hi',
  false, now() - interval '1 minute') $$, 'P0001', null, 'expiry is in the future');
select throws_ok($$ select public.post_note('e7000000-0000-4000-8000-000000000001', null, 'Hi',
  false, now() + interval '91 days') $$, 'P0001', null, 'expiry is at most 90 days away');

select is((public.post_note('e7000000-0000-4000-8000-000000000001', null, '  Dinner at 7 ', true,
  now() + interval '1 day')).body, 'Dinner at 7', 'a note is posted trimmed');
select tests.reset_role();
insert into n select 'all', id from public.space_notes where body = 'Dinner at 7';
insert into n values ('direct', tests.post_note('nt_ana', 'nt_ben', 'For Ben'));
select is(array[pg_temp.notes_of('nt_ben', 'note'), pg_temp.notes_of('nt_cat', 'note'),
  pg_temp.notes_of('nt_ana', 'note')], array[2, 1, 0],
  'recipients are notified, the author is not');
select is((select count(*)::int from public.space_note_reads where user_id = tests.user_id('nt_ana')),
  2, 'the author has read their own notes');

select tests.act_as('nt_cat');
select is((public.reply_to_note((select id from n where k = 'all'), ' Count me in ')).body,
  'Count me in', 'a member replies to an everyone note');
select tests.act_as('nt_ben');
select public.reply_to_note((select id from n where k = 'all'), 'Me too');
select public.reply_to_note((select id from n where k = 'direct'), 'Thanks');
select tests.reset_role();
select is(array[pg_temp.notes_of('nt_ana', 'note_reply'), pg_temp.notes_of('nt_cat', 'note_reply'),
  pg_temp.notes_of('nt_ben', 'note_reply')], array[3, 1, 0],
  'the author and earlier repliers hear about replies; repliers never about their own');
select is((select count(*)::int from public.notifications where type = 'note_reply'
  and subject_id = (select id from n where k = 'direct') and recipient_id <> tests.user_id('nt_ana')),
  0, 'a reply to a direct note goes to the author and recipient only');

select tests.act_as('nt_cat');
select public.mark_note_read((select id from n where k = 'all'));
select tests.reset_role();
select is((select count(*)::int from public.space_note_reads where user_id = tests.user_id('nt_cat')),
  1, 'reading records read state');
select is((select count(*)::int from public.notifications where recipient_id = tests.user_id('nt_cat')
  and read_at is null), 0, 'reading marks the matching notifications read');
update public.space_note_reads set read_at = now() - interval '1 hour';
select tests.act_as('nt_cat');
select public.reply_to_note((select id from n where k = 'all'), 'Again');
select tests.reset_role();
select ok((select read_at > now() - interval '1 minute' from public.space_note_reads
  where user_id = tests.user_id('nt_cat')), 'replying bumps the read time');
select tests.act_as('nt_ben');
select throws_ok($$ select public.mark_note_read('e7000000-0000-4000-8000-0000000000ff') $$,
  'P0002', null, 'an unknown note is not found');

select * from finish();
rollback;
