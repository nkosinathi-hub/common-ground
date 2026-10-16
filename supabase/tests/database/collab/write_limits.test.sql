begin;
select plan(4);
select tests.collab_setup();

-- Sixty comments in the last hour by Ana (written directly, as the server would).
insert into public.comments (space_id, watch_item_id, author_id, body)
select tests.space('Us'), tests.item('Frieren'), tests.user_id('ana'), 'c' || n
from generate_series(1, 60) n;

select tests.act_as('ana');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'One more', false, '{}') $$, 'P0001', 'slow down: at most 60 comments an hour',
  'the sixty-first comment in an hour is refused');
select tests.act_as('ben');
select lives_ok($$ select public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Mine', false, '{}') $$, 'the limit is per author');

-- Thirty recommendations from Ana today, already answered.
select tests.reset_role();
insert into public.recommendations
  (space_id, watch_item_id, sender_id, recipient_id, status, responded_at)
select tests.space('Us'), tests.item('Frieren'), tests.user_id('ana'), tests.user_id('ben'),
  'acknowledged', now()
from generate_series(1, 30);

select tests.act_as('ana');
select throws_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('cat')],
  null) $$, 'P0001', 'slow down: at most 30 recommendations a day',
  'the thirty-first recommendation in a day is refused');
select tests.act_as('ben');
select lives_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('cat')],
  null) $$, 'another member can still recommend');

select * from finish();
rollback;
