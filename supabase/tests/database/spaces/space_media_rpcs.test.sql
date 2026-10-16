-- set_space_media swaps a checked object path in; cleanup candidates list unreferenced objects.
begin;
select plan(11);

select tests.create_user('smr_ana'); select tests.create_user('smr_ben');
insert into public.spaces (id, name) values
  ('d6000000-0000-4000-8000-000000000001', 'Us'), ('d6000000-0000-4000-8000-000000000002', 'Gone');
insert into public.space_members (space_id, user_id, role) values
  ('d6000000-0000-4000-8000-000000000001', tests.user_id('smr_ana'), 'owner'),
  ('d6000000-0000-4000-8000-000000000001', tests.user_id('smr_ben'), 'member');
create temp table p (k text primary key, path text);
grant select on p to authenticated, service_role;
insert into p values
  ('a1', 'd6000000-0000-4000-8000-000000000001/avatar/e2000000-0000-4000-8000-000000000001.webp'),
  ('a2', 'd6000000-0000-4000-8000-000000000001/avatar/e2000000-0000-4000-8000-000000000002.png'),
  ('c1', 'd6000000-0000-4000-8000-000000000001/cover/e2000000-0000-4000-8000-000000000003.jpg'),
  ('gone', 'd6000000-0000-4000-8000-000000000002/cover/e2000000-0000-4000-8000-000000000004.jpg'),
  ('fresh', 'd6000000-0000-4000-8000-000000000001/cover/e2000000-0000-4000-8000-000000000005.jpg');
insert into storage.objects (bucket_id, name, created_at)
  select 'space-media', path, case when k = 'fresh' then now() else now() - interval '2 hours' end
  from p where k <> 'a2';

select tests.act_as('smr_ana');
select is(public.set_space_media('d6000000-0000-4000-8000-000000000001', 'avatar',
  (select path from p where k = 'a1')), null, 'the first avatar replaces nothing');
select throws_ok($$ select public.set_space_media('d6000000-0000-4000-8000-000000000001', 'avatar',
  (select path from p where k = 'a2')) $$, 'P0002', null, 'the object must exist');
select throws_ok($$ select public.set_space_media('d6000000-0000-4000-8000-000000000001', 'cover',
  (select path from p where k = 'a1')) $$, 'P0002', null, 'the path must be in the same slot');
select throws_ok($$ select public.set_space_media('d6000000-0000-4000-8000-000000000001', 'banner',
  null) $$, 'P0001', null, 'only avatar and cover');
select tests.reset_role();
insert into storage.objects (bucket_id, name, created_at)
  select 'space-media', path, now() - interval '2 hours' from p where k = 'a2';
select tests.act_as('smr_ana');
select is(public.set_space_media('d6000000-0000-4000-8000-000000000001', 'avatar',
  (select path from p where k = 'a2')), (select path from p where k = 'a1'),
  'a new avatar returns the previous path for removal');
select is((select avatar_path from public.spaces where id = 'd6000000-0000-4000-8000-000000000001'),
  (select path from p where k = 'a2'), 'the avatar path is stored');
select is((select count(*)::int from public.activity_events where event_type = 'space_customised'),
  2, 'each change is recorded');

select tests.act_as('smr_ben');
select throws_ok($$ select public.set_space_media('d6000000-0000-4000-8000-000000000001', 'avatar',
  null) $$, '42501', null, 'members cannot change media');
select throws_ok($$ select * from public.space_media_cleanup_candidates() $$, '42501', null,
  'clients cannot list cleanup candidates');

select tests.reset_role();
delete from public.spaces where id = 'd6000000-0000-4000-8000-000000000002';
set local role service_role;
select is((select array_agg(object_path order by object_path) from public.space_media_cleanup_candidates()
    where object_path like 'd6000000%'),
  (select array_agg(path order by path) from p where k in ('a1', 'c1', 'gone')),
  'replaced, unused and deleted-space objects are candidates; current and fresh ones are not');
reset role;
select tests.act_as('smr_ana');
select lives_ok($$ select public.set_space_media('d6000000-0000-4000-8000-000000000001', 'avatar',
  null) $$, 'null clears the avatar');

select * from finish();
rollback;
