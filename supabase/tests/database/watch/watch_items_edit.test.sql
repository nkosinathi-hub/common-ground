begin;
select plan(10);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('cat');
select tests.act_as('ana');
select public.create_space('Us', 'friends');
select tests.reset_role();
create temp table ids as select (select id from public.spaces where created_by = tests.user_id('ana')) as space_id;
grant select on ids to authenticated;
insert into public.space_members (space_id, user_id) values
  ((select space_id from ids), tests.user_id('ben')), ((select space_id from ids), tests.user_id('cat'));

select tests.act_as('ben');
insert into public.watch_items (space_id, title, media_type, shared_intent)
  select (select space_id from ids), 'Title ' || n, 'movie', 'want_to_watch'
  from generate_series(1, 5) n;

select tests.act_as('cat');
update public.watch_items set shared_intent = 'watch_together' where title = 'Title 1';
select is((select shared_intent::text from public.watch_items where title = 'Title 1'),
  'watch_together', 'any member changes the shared intent');
select throws_ok($$ update public.watch_items set created_by = tests.user_id('cat') $$, '42501',
  null, 'author is server-owned');
delete from public.watch_items where title = 'Title 2';
select is((select count(*) from public.watch_items)::int, 5, 'non-author member cannot delete');

select tests.act_as('ben');
delete from public.watch_items where title = 'Title 2';
select is((select count(*) from public.watch_items)::int, 4, 'author deletes');
select tests.act_as('ana');
delete from public.watch_items where title = 'Title 3';
select is((select count(*) from public.watch_items)::int, 3, 'owner deletes');

select is((select array_agg(title order by sort_key, id) from public.list_watch_items(
  (select space_id from ids), sort_by => 'title', page_size => 2)), array['Title 1', 'Title 4'],
  'title sort, first page');
select is((select array_agg(title) from public.list_watch_items((select space_id from ids),
  sort_by => 'title', after_key => 'title 4', after_id => (select id from public.watch_items where title = 'Title 4'), page_size => 2)),
  array['Title 5'], 'keyset continues after the cursor');
select is((select array_agg(title) from public.list_watch_items((select space_id from ids),
  intent => 'watch_together')), array['Title 1'], 'intent filter');
select is((select count(*) from public.list_watch_items((select space_id from ids),
  search => 'LE 5'))::int, 1, 'case-insensitive search');
select is((select count(*) from public.list_watch_items((select space_id from ids),
  my_status => 'not_started'))::int, 3, 'titles without my progress count as not started');

select * from finish();
rollback;
