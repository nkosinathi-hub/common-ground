begin;
select plan(12);
select tests.collab_setup();
create temp table c (id uuid);
grant all on c to authenticated;

select tests.act_as('ana');
insert into c select (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'You two should see this', false,
  array[tests.user_id('ben'), tests.user_id('ben'), tests.user_id('ana')])).id;
select is((select count(*) from public.comment_mentions)::int, 2, 'duplicate ids stored once');
select is((select count(*) from public.notifications)::int, 0, 'author is never notified');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Hey eve', false, array[tests.user_id('eve')]) $$, 'P0001', null,
  'mention must be a current member');
select is((select count(*) from public.comments)::int, 1, 'rejected mention leaves no comment');

select tests.act_as('ben');
select is((select count(*) from public.notifications where type = 'mention'
  and subject_type = 'watch_item' and subject_id = tests.item('Frieren')
  and deduplication_key = 'mention:' || (select id from c) || ':' || tests.user_id('ben'))::int,
  1, 'mentioned member is notified with the title as subject');
select is((select count(*) from public.comment_mentions)::int, 2, 'member reads mentions');

select tests.act_as('cat');
select is((select count(*) from public.notifications)::int, 0, 'unmentioned member gets nothing');

select tests.act_as('eve');
select is((select count(*) from public.comment_mentions)::int, 0, 'nonmember reads no mentions');

select tests.reset_role();
select public.notify(tests.user_id('ben'), tests.space('Us'), 'mention', 'watch_item',
  tests.item('Frieren'), 'mention:' || (select id from c) || ':' || tests.user_id('ben'));
select is((select count(*) from public.notifications
  where recipient_id = tests.user_id('ben'))::int, 1, 'same dedup key notifies once');
select throws_ok($$ insert into public.comment_mentions (comment_id, user_id)
  values ((select id from c), tests.user_id('eve')) $$, 'P0001', null,
  'table rejects non-member mentions too');

delete from public.space_members where user_id = tests.user_id('ben');
select tests.act_as('ana');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Ben?', false, array[tests.user_id('ben')]) $$, 'P0001', null, 'removed member cannot be mentioned');
select throws_ok($$ insert into public.comment_mentions (comment_id, user_id)
  values ((select id from c), tests.user_id('cat')) $$, '42501', null, 'no direct mention insert');

select * from finish();
rollback;
