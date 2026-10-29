-- For you: personal, private, genre-led; providers only nudge; features come from the service role.
begin;
select plan(10);

select tests.create_user('fy_ana'); select tests.create_user('fy_ben');
select tests.act_as('fy_ana');
create temp table ids (space_id uuid, drama uuid, drama2 uuid, comedy uuid, horror uuid);
grant select, update on ids to authenticated, service_role;
insert into ids (space_id) select public.create_space('For you', 'couple');
update ids set
  drama = public.add_catalog_title((select space_id from ids), 'tv', 9301, 'Drama A', 'series', 2020, '', null, 'watch_together'),
  drama2 = public.add_catalog_title((select space_id from ids), 'movie', 9302, 'Drama B', 'movie', 2020, '', null, 'watch_together'),
  comedy = public.add_catalog_title((select space_id from ids), 'movie', 9303, 'Comedy', 'movie', 2020, '', null, 'watch_together'),
  horror = public.add_catalog_title((select space_id from ids), 'movie', 9304, 'Horror', 'movie', 2020, '', null, 'watch_together');
select tests.reset_role();
insert into public.space_members (space_id, user_id) values ((select space_id from ids), tests.user_id('fy_ben'));

select tests.act_as('fy_ana');
select throws_ok($$ select public.set_watch_features((select space_id from ids), 'tv', 9301, '{drama}', true) $$,
  '42501', null, 'a member cannot set a title''s features');
set local role service_role;
select public.set_watch_features((select space_id from ids), 'tv', 9301, '{drama}', false);
select public.set_watch_features((select space_id from ids), 'movie', 9302, '{drama}', false);
select public.set_watch_features((select space_id from ids), 'movie', 9303, '{comedy}', true);
select public.set_watch_features((select space_id from ids), 'movie', 9304, '{horror}', false);
reset role;
select is((select genres from public.watch_items where id = (select drama2 from ids)), '{drama}',
  'the service role writes canonical genres');

select tests.act_as('fy_ana');
insert into public.watch_opinions (space_id, watch_item_id, opinion) values
  ((select space_id from ids), (select drama from ids), 'liked'),
  ((select space_id from ids), (select horror from ids), 'disliked');
create temp table scores as select * from public.watch_for_you((select space_id from ids));
select is((select score from scores where item_id = (select drama2 from ids)), 0.3333,
  'a liked series lifts a film of the same genre (1 like / 3)');
select is((select reason from scores where item_id = (select drama2 from ids)), 'drama',
  'with its reason');
select is((select score from scores where item_id = (select comedy from ids)), 0.1000,
  'streaming here only nudges');
select is((select score from scores where item_id = (select horror from ids)), -0.3333,
  'a disliked genre sinks');
select is((select opinion::text from scores where item_id = (select horror from ids)), 'disliked',
  'and the opinion comes along so lists can put it last');

create temp table ranked as select title, ordinality from public.list_watch_items(
  (select space_id from ids), sort_by => 'for_you') with ordinality;
select is((select array_agg(title order by title) filter (where ordinality <= 2) || array_agg(title
  order by ordinality) filter (where ordinality > 2) from ranked), array['Drama A', 'Drama B',
  'Comedy', 'Horror'], 'For you sorts the library, dramas first and your dislikes last');
select is((select reason from public.list_watch_items((select space_id from ids), sort_by => 'for_you',
  page_size => 1)), 'drama', 'and the top card says why');

select tests.act_as('fy_ben');
select is((select count(*)::int from public.watch_for_you((select space_id from ids)) where score <> 0
  and score <> 0.1), 0, 'Ben''s order is untouched by Ana''s likes');

select * from finish();
rollback;
