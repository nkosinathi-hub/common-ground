begin;
select plan(16);
select tests.collab_setup();

select tests.act_as('ana');
select is(cardinality(public.recommend(tests.item('Frieren'),
  array[tests.user_id('ben'), tests.user_id('cat')], 'Episode 10 is the one')), 2,
  'one recommendation per recipient');
select throws_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('ben')], null) $$,
  'P0001', null, 'duplicate pending recommendation blocked');
select throws_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('eve')], null) $$,
  'P0001', null, 'recipient must be in the space');
select throws_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('ana')], null) $$,
  'P0001', null, 'cannot recommend to yourself');
select throws_ok($$ select public.recommend(tests.item('Frieren'), '{}', null) $$,
  'P0001', null, 'needs at least one recipient');
select throws_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('ben')],
  repeat('n', 501)) $$, 'P0001', null, 'note is at most 500 characters');
select throws_ok($$ select public.recommend(tests.item('Dune'), array[tests.user_id('ben')], null) $$,
  '42501', null, 'cannot recommend a title from another space');
select throws_ok($$ insert into public.recommendations (space_id, watch_item_id, recipient_id)
  values (tests.space('Us'), tests.item('Frieren'), tests.user_id('ben')) $$, '42501', null,
  'no direct insert');
select is((select count(*) from public.recommendations)::int, 2, 'sender sees what they sent');

select tests.act_as('ben');
select is((select count(*) from public.recommendations)::int, 1, 'recipient sees only their own');
select is((select count(*) from public.notifications where type = 'recommendation'
  and subject_type = 'watch_item' and subject_id = tests.item('Frieren'))::int, 1,
  'recipient is notified');

select tests.act_as('cat');
select throws_ok($$ select public.respond_recommendation(
  (select id from public.recommendations limit 1), 'maybe') $$, 'P0001', null,
  'unknown response rejected');

select tests.act_as('eve');
select is((select count(*) from public.recommendations)::int, 0, 'nonmember sees none');
select is((select count(*) from public.notifications)::int, 0, 'nonmember is not notified');
select throws_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('ben')], null) $$,
  '42501', null, 'nonmember cannot recommend');

select tests.act_as('ana');
select throws_ok($$ select public.respond_recommendation(
  (select id from public.recommendations where recipient_id = tests.user_id('ben')), 'dismissed') $$,
  '42501', null, 'sender cannot respond for the recipient');

select * from finish();
rollback;
