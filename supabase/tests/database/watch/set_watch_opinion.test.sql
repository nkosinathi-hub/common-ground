-- set_watch_opinion: the app's one way to like or dislike; a second choice replaces the first.
begin;
select plan(5);

select tests.create_user('so_ana'); select tests.create_user('so_eve');
select tests.act_as('so_ana');
create temp table ids (space_id uuid, item uuid);
grant select, update on ids to authenticated;
insert into ids (space_id) select public.create_space('Opinions', 'couple');
update ids set item = public.add_catalog_title((select space_id from ids), 'movie', 9301, 'Film',
  'movie', 2020, '', null, 'watch_together');

select lives_ok($$ select public.set_watch_opinion((select item from ids), 'liked') $$,
  'a member likes a title');
select lives_ok($$ select public.set_watch_opinion((select item from ids), 'disliked') $$,
  'and changes their mind');
select is((select opinion::text || ':' || count(*) over () from public.watch_opinions),
  'disliked:1', 'one opinion per person and title, the latest kept');
select lives_ok($$ select public.set_watch_opinion((select item from ids)) $$,
  'clearing removes it');

select tests.act_as('so_eve');
select throws_ok($$ select public.set_watch_opinion((select item from ids), 'liked') $$, '42501',
  null, 'a non-member cannot');

select * from finish();
rollback;
