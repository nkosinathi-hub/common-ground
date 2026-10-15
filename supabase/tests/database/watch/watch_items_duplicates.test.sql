begin;
select plan(8);

select tests.create_user('ana');
select tests.act_as('ana');
select public.create_space('Us', 'couple');
select public.create_space('Other', 'blank');
select tests.reset_role();
create temp table s as select id, name from public.spaces where created_by = tests.user_id('ana');
grant select on s to authenticated;

select tests.act_as('ana');
select lives_ok($$ select public.add_catalog_title((select id from s where name = 'Us'), 'tv', 1399,
  'Got', 'series', 2011, '', null, 'want_to_watch') $$, 'first catalog add works');
select throws_ok($$ select public.add_catalog_title((select id from s where name = 'Us'), 'tv',
  1399, 'Got', 'series', 2011, '', null, 'want_to_watch') $$, 'P0001', 'Already on your list',
  'duplicate catalog add is rejected with friendly copy');
select lives_ok($$ select public.add_catalog_title((select id from s where name = 'Us'), 'movie',
  1399, 'Other type', 'movie', null, '', null, 'want_to_watch') $$,
  'same id but another catalog type is fine');
select lives_ok($$ select public.add_catalog_title((select id from s where name = 'Other'), 'tv',
  1399, 'Got', 'series', 2011, '', null, 'want_to_watch') $$, 'same title in another space is fine');

select tests.reset_role();
select throws_ok($$ insert into public.watch_items (space_id, catalog_type, catalog_id, title,
  media_type) values ((select id from s where name = 'Us'), 'tv', 4242, 'Race', 'series'),
  ((select id from s where name = 'Us'), 'tv', 4242, 'Race', 'series') $$, '23505', null,
  'concurrent double insert hits the unique constraint');

select tests.act_as('ana');
insert into public.watch_items (space_id, title, media_type)
  values ((select id from s where name = 'Us'), 'Home video', 'movie');
select throws_ok($$ insert into public.watch_items (space_id, title, media_type)
  values ((select id from s where name = 'Us'), '  home VIDEO ', 'movie') $$, '23505', null,
  'manual duplicate title (case and spacing) is rejected');
select lives_ok($$ insert into public.watch_items (space_id, title, media_type)
  values ((select id from s where name = 'Us'), 'Home video', 'series') $$,
  'same manual title as another media type is fine');
select throws_ok($$ insert into public.watch_items (space_id, title, media_type, release_year)
  values ((select id from s where name = 'Us'), 'Odd', 'movie', 1700) $$, '23514', null,
  'release year is bounded');

select * from finish();
rollback;
