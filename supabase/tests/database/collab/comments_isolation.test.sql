begin;
select plan(15);
select tests.collab_setup();

select tests.act_as('ana');
select lives_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Loved the finale', false, '{}') $$, 'member comments on a title');
select lives_ok($$ select public.post_comment(tests.space('Us'), 'idea', tests.idea('Cafe'),
  'Corner spot?', true, array[tests.user_id('ben')]) $$, 'member comments on an idea');
select is((select count(*) from public.comments where idea_id is not null and spoiler)::int, 1,
  'idea comment stored with spoiler flag');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Dune'),
  'Sneaky', false, '{}') $$, '23503', null, 'cross-space parent rejected');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'idea', tests.item('Frieren'),
  'Wrong kind', false, '{}') $$, '23503', null, 'parent of the wrong kind rejected');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'task', tests.item('Frieren'),
  'Nope', false, '{}') $$, 'P0001', null, 'unknown parent kind rejected');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  '   ', false, '{}') $$, 'P0001', null, 'blank body rejected');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  repeat('a', 4001), false, '{}') $$, 'P0001', null, 'body over 4000 characters rejected');
select throws_ok($$ insert into public.comments (space_id, watch_item_id, body)
  values (tests.space('Us'), tests.item('Frieren'), 'direct') $$, '42501', null,
  'no direct insert');

select tests.act_as('ben');
select is((select count(*) from public.comments)::int, 2, 'fellow member reads comments');
select is((select subject_type || ':' || (subject_id = tests.idea('Cafe')) from public.notifications),
  'idea:true', 'a mention on an idea links to the idea');

select tests.act_as('eve');
select is((select count(*) from public.comments)::int, 0, 'nonmember reads nothing');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Hi', false, '{}') $$, '42501', null, 'nonmember cannot comment');

select tests.reset_role();
select throws_ok($$ insert into public.comments (space_id, body) values (tests.space('Us'), 'x') $$,
  '23514', null, 'a comment needs exactly one parent');

select tests.act_as_anon();
select throws_ok($$ select count(*) from public.comments $$, '42501', null, 'anon has no access');

select * from finish();
rollback;
