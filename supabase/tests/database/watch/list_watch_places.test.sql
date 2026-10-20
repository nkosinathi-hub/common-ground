-- The shared list carries where each member is and where the space is together.
begin;
select plan(5);

select tests.create_user('lp_ana');
select tests.create_user('lp_ben');
select tests.create_user('lp_eve');
select tests.act_as('lp_ana');
create temp table ids (space_id uuid, show uuid);
grant select, update on ids to authenticated;
insert into ids (space_id) select public.create_space('Places', 'couple');
select tests.reset_role();
insert into public.space_members (space_id, user_id)
  values ((select space_id from ids), tests.user_id('lp_ben'));

select tests.act_as('lp_ana');
update ids set show = public.add_catalog_title((select space_id from ids), 'tv', 9101, 'Show',
  'series', 2020, '', null, 'watch_together');
select public.mark_episode_watched((select show from ids), 1, 4, 'manual');
select tests.act_as('lp_ben');
select public.mark_episode_watched((select show from ids), 1, 2, 'player');
select tests.reset_role();
insert into public.together_progress (space_id, watch_item_id, season, episode)
  values ((select space_id from ids), (select show from ids), 1, 2);

select tests.act_as('lp_ana');
create temp table row as select * from public.list_watch_items((select space_id from ids));
grant select on row to authenticated;
select is((select jsonb_array_length(places) from row), 2, 'both members'' places are listed');
create function pg_temp.place(who text) returns text language sql as $$
  select 'S' || (p ->> 'season') || 'E' || (p ->> 'episode') from row, jsonb_array_elements(places) p
  where p ->> 'user_id' = tests.user_id(who)::text $$;
select is(pg_temp.place('lp_ana'), 'S1E4', 'her place is S1E4');
select is(pg_temp.place('lp_ben'), 'S1E2', 'his place is S1E2, ahead of hers or not');
select is((select (together ->> 'season', together ->> 'episode') from row), ('1'::text, '2'::text),
  'together is S1E2');
select is((select my_progress from row), 'watching', 'her own status is still there');

select * from finish();
rollback;
