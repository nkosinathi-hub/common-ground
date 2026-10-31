-- episode_statuses: who saw each episode and when it was seen together, for members only.
begin;
select plan(5);

select tests.create_user('es_ana'); select tests.create_user('es_ben'); select tests.create_user('es_eve');
select tests.act_as('es_ana');
create temp table ids (space_id uuid, show uuid);
grant select, update on ids to authenticated;
insert into ids (space_id) select public.create_space('Episodes', 'couple');
select tests.reset_role();
insert into public.space_members (space_id, user_id) values ((select space_id from ids), tests.user_id('es_ben'));
select tests.act_as('es_ana');
update ids set show = public.add_catalog_title((select space_id from ids), 'tv', 9101, 'Show',
  'series', 2020, '', null, 'watch_together');
select public.mark_episode_watched((select show from ids), 1, 1, 'manual');
select public.mark_episode_watched((select show from ids), 1, 2, 'manual');
select tests.act_as('es_ben');
select public.mark_episode_watched((select show from ids), 1, 1, 'manual');
select tests.reset_role();
insert into public.episode_watches (space_id, watch_item_id, user_id, season, episode, source, watched_at)
  values ((select space_id from ids), (select show from ids), tests.user_id('es_ben'), 1, 2, 'party',
    '2026-10-27 20:00+02');

select tests.act_as('es_ana');
select is((select count(*)::int from public.episode_statuses((select show from ids))), 2,
  'one row per watched episode');
select is((select cardinality(watched_by) from public.episode_statuses((select show from ids))
  where season = 1 and episode = 1), 2, 'both people who saw S1E1');
select is((select together_on from public.episode_statuses((select show from ids))
  where season = 1 and episode = 2), '2026-10-27'::date, 'S1E2 was watched together on the party day');
select is((select together_on from public.episode_statuses((select show from ids))
  where season = 1 and episode = 1), null::date, 'S1E1 was watched apart');
select tests.act_as('es_eve');
select is((select count(*)::int from public.episode_statuses((select show from ids))), 0,
  'someone outside the space sees nothing');
select tests.reset_role();

select * from finish();
rollback;
