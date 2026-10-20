-- Episode history moves each person's place forward only; a ticked film is completed.
begin;
select plan(12);

select tests.create_user('ep_ana');
select tests.create_user('ep_ben');
select tests.create_user('ep_eve');
select tests.act_as('ep_ana');
create temp table ids (space_id uuid, show uuid, film uuid);
grant select, update on ids to authenticated;
insert into ids (space_id) select public.create_space('Episodes', 'couple');
select tests.reset_role();
insert into public.space_members (space_id, user_id)
  values ((select space_id from ids), tests.user_id('ep_ben'));

select tests.act_as('ep_ana');
update ids set show = public.add_catalog_title((select space_id from ids), 'tv', 9001, 'Show',
  'series', 2020, '', null, 'watch_together');
update ids set film = public.add_catalog_title((select space_id from ids), 'movie', 9002, 'Film',
  'movie', 2020, '', null, 'watch_together');

select lives_ok($$ select public.mark_episode_watched((select show from ids), 1, 2, 'manual') $$,
  'a member ticks an episode');
select is((select (season, episode, status::text) from public.watch_progress
  where watch_item_id = (select show from ids) and user_id = tests.user_id('ep_ana')),
  (1, 2, 'watching'::text), 'the first episode starts her place there');
select public.mark_episode_watched((select show from ids), 1, 1, 'manual');
select is((select (season, episode) from public.watch_progress
  where watch_item_id = (select show from ids) and user_id = tests.user_id('ep_ana')),
  (1, 2), 'an earlier episode, a rewatch, never moves the place back');
select public.mark_episode_watched((select show from ids), 2, 1, 'jellyfin');
select is((select (season, episode) from public.watch_progress
  where watch_item_id = (select show from ids) and user_id = tests.user_id('ep_ana')),
  (2, 1), 'a later episode moves it forward across seasons');
select public.mark_episode_watched((select show from ids), 0, 5, 'manual');
select is((select (season, episode) from public.watch_progress
  where watch_item_id = (select show from ids) and user_id = tests.user_id('ep_ana')),
  (2, 1), 'specials are history only');
select is((select count(*)::int from public.episode_watches
  where watch_item_id = (select show from ids)), 4, 'every tick is kept as history');

select public.save_watch_progress((select show from ids), 'watching', 1, 1, null, null);
select is((select season from public.watch_progress
  where watch_item_id = (select show from ids) and user_id = tests.user_id('ep_ana')),
  1, 'moving back is still possible by saving the place by hand');

select public.mark_episode_watched((select film from ids), null, null, 'manual');
select is((select status::text from public.watch_progress
  where watch_item_id = (select film from ids) and user_id = tests.user_id('ep_ana')),
  'completed', 'a ticked film is completed');

select tests.act_as('ep_ben');
select is((select count(*)::int from public.watch_progress
  where watch_item_id = (select show from ids) and user_id = tests.user_id('ep_ben')),
  0, 'her ticks never touch his place');
select throws_ok($$ select public.mark_episode_watched((select show from ids), 1, 1, 'party') $$,
  '22023', null, 'only parties write party history');
select throws_ok($$ insert into public.episode_watches (space_id, watch_item_id, user_id, source)
  values ((select space_id from ids), (select film from ids), tests.user_id('ep_ben'), 'manual') $$,
  '42501', null, 'history is written only through the RPCs');

select tests.act_as('ep_eve');
select throws_ok($$ select public.mark_episode_watched((select show from ids), 1, 1, 'manual') $$,
  'P0002', null, 'a non-member cannot tick a title');

select * from finish();
rollback;
