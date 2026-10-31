-- Comment threads (v0.6, #77): one level of replies, hearts, and an episode tag on title comments.
begin;
select plan(13);
select tests.collab_setup();
create temp table c (name text primary key, id uuid);
grant select, insert on c to authenticated;

select tests.act_as('ana');
select public.save_watch_progress(tests.item('Frieren'), 'watching', 1, 3, null);
insert into c select 'root', (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Episode three!', false, '{}')).id;
select is((select season || ':' || episode from public.comments where id = (select id from c where name = 'root')),
  '1:3', 'a title comment is tagged with the author''s place');
insert into c select 'tagged', (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Back to the start', false, '{}', null, 1, 1)).id;
select is((select episode from public.comments where id = (select id from c where name = 'tagged')), 1,
  'an explicit tag wins');
insert into c select 'idea', (public.post_comment(tests.space('Us'), 'idea', tests.idea('Cafe'),
  'Corner spot', false, '{}')).id;
select ok((select season is null from public.comments where id = (select id from c where name = 'idea')),
  'idea comments carry no episode');

select tests.act_as('ben');
insert into c select 'reply', (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Agreed', false, '{}', (select id from c where name = 'root'))).id;
select is((select reply_to from public.comments where id = (select id from c where name = 'reply')),
  (select id from c where name = 'root'), 'a reply hangs off its comment');
select is((select season || ':' || episode from public.comments where id = (select id from c where name = 'reply')),
  '1:3', 'a reply shares its comment''s episode');
insert into c select 'nested', (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Me too', false, '{}', (select id from c where name = 'reply'))).id;
select is((select reply_to from public.comments where id = (select id from c where name = 'nested')),
  (select id from c where name = 'root'), 'a reply to a reply joins the same thread');
select throws_ok($$ select public.post_comment(tests.space('Us'), 'idea', tests.idea('Cafe'),
  'Wrong thread', false, '{}', (select id from c where name = 'root')) $$, 'P0001', null,
  'a reply stays in its comment''s thread');

insert into public.comment_reactions (comment_id) values ((select id from c where name = 'root'));
select tests.act_as('cat');
insert into public.comment_reactions (comment_id) values ((select id from c where name = 'root'));
select is((select count(*)::int from public.comment_reactions), 2, 'members see every heart');
delete from public.comment_reactions where user_id = tests.user_id('ben');
select is((select count(*)::int from public.comment_reactions), 2, 'nobody removes another''s heart');
select throws_ok($$ insert into public.comment_reactions (comment_id, user_id)
  values ((select id from c where name = 'root'), tests.user_id('ana')) $$, '42501', null,
  'a heart is only ever your own');

select tests.act_as('eve');
select is((select count(*)::int from public.comment_reactions), 0, 'non-members see no hearts');
select throws_ok($$ insert into public.comment_reactions (comment_id)
  values ((select id from c where name = 'root')) $$, '42501', null, 'non-members cannot heart');

select tests.act_as('ana');
select public.delete_comment((select id from c where name = 'root'));
select is((select count(*)::int from public.comments where reply_to is not null), 0,
  'deleting a comment takes its replies');

select * from finish();
rollback;
