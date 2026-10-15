begin;
select plan(13);
select tests.collab_setup();
create temp table c (who text, id uuid);
grant all on c to authenticated;

select tests.act_as('ana');
insert into c select 'ana', (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'First take', false, '{}')).id;
select tests.act_as('ben');
insert into c select 'ben', (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Ben here', false, '{}')).id;
insert into c select 'ben2', (public.post_comment(tests.space('Us'), 'watch', tests.item('Frieren'),
  'Again', false, '{}')).id;

select throws_ok($$ select public.edit_comment((select id from c where who = 'ana'), 'Mine', false) $$,
  '42501', null, 'only the author edits');
select throws_ok($$ update public.comments set body = 'x' $$, '42501', null, 'no direct update');
select throws_ok($$ select public.delete_comment((select id from c where who = 'ana')) $$,
  '42501', null, 'member cannot delete another member''s comment');
select throws_ok($$ delete from public.comments $$, '42501', null, 'no direct delete');
select lives_ok($$ select public.delete_comment((select id from c where who = 'ben2')) $$,
  'author deletes own comment');

select tests.act_as('ana');
select lives_ok($$ select public.edit_comment((select id from c where who = 'ana'),
  'Second take', true) $$, 'author edits own comment');
select is((select body || ':' || spoiler || ':' || edited from public.comments
  where id = (select id from c where who = 'ana')), 'Second take:true:true', 'edit is marked');
select throws_ok($$ select public.edit_comment((select id from c where who = 'ana'), '', false) $$,
  'P0001', null, 'edit validates the body');

select tests.act_as('eve');
select throws_ok($$ select public.delete_comment((select id from c where who = 'ben')) $$,
  '42501', null, 'stranger cannot delete');

select tests.act_as('ana');
select lives_ok($$ select public.delete_comment((select id from c where who = 'ben')) $$,
  'owner moderates a member''s comment');
select is((select count(*) from public.comments)::int, 1, 'only the edited comment is left');

select tests.reset_role();
delete from public.space_members where user_id = tests.user_id('ana');
select tests.act_as('ana');
select throws_ok($$ select public.edit_comment((select id from c where who = 'ana'), 'Back', false) $$,
  '42501', null, 'author who left cannot edit');

select tests.reset_role();
delete from public.watch_items where id = tests.item('Frieren');
select is((select count(*) from public.comments where space_id = tests.space('Us'))::int, 0, 'comments go with their title');

select * from finish();
rollback;
