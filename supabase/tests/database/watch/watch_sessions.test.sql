begin;
select plan(9);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('cat');
select tests.create_user('eve');
select tests.act_as('ana');
select public.create_space('Us', 'family');
select tests.reset_role();
create temp table ids as select (select id from public.spaces where created_by = tests.user_id('ana')) as space_id, null::uuid as item_id,
  null::uuid as session_id;
grant select, update on ids to authenticated;
insert into public.space_members (space_id, user_id) values
  ((select space_id from ids), tests.user_id('ben')), ((select space_id from ids), tests.user_id('cat'));

select tests.act_as('ben');
update ids set item_id = public.add_catalog_title((select space_id from ids), 'movie', 9, 'Film',
  'movie', 2020, '', null, 'watch_together');
select public.save_watch_progress((select item_id from ids), 'watching', null, null, 4, null);

select tests.act_as('ana');
update ids set session_id = public.log_watch_session((select item_id from ids), '2026-10-10',
  array[tests.user_id('ana'), tests.user_id('ben')], 'Popcorn night');

select is((select array_agg(status::text || ':' || completed_on order by status)
  from public.watch_progress), array['completed:2026-10-10', 'completed:2026-10-10'],
  'present members are marked completed on the watched date');
select is((select rating::int from public.watch_progress where user_id = tests.user_id('ben')), 4,
  'existing rating is kept');
select is((select count(*) from public.watch_progress where user_id = tests.user_id('cat'))::int, 0,
  'absent member progress untouched');
select is((select count(*) from public.watch_session_members
  where session_id = (select session_id from ids))::int, 2, 'who was there is recorded');
select is((select count(*) from public.activity_events where event_type = 'watched_together')::int,
  1, 'session records activity');
select throws_ok($$ select public.log_watch_session((select item_id from ids), '2026-10-11',
  array[tests.user_id('eve')], null) $$, 'P0001', null, 'nonmember cannot be marked present');
select throws_ok($$ select public.log_watch_session((select item_id from ids), '2026-10-11',
  array[]::uuid[], null) $$, 'P0001', null, 'someone must be present');
select throws_ok($$ insert into public.watch_session_members (session_id, space_id, user_id)
  values ((select session_id from ids), (select space_id from ids), tests.user_id('cat')) $$,
  '42501', null, 'session members are written only by the rpc');

select tests.act_as('eve');
select throws_ok($$ select public.log_watch_session((select item_id from ids), '2026-10-11',
  array[tests.user_id('eve')], null) $$, 'P0002', null, 'nonmember cannot log on a guessed item');

select * from finish();
rollback;
