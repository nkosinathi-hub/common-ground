begin;
select plan(13);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('cal');

select tests.act_as('ana');
select public.create_space('Shared', 'friends');
select tests.act_as('cal');
select public.create_space('Solo', 'blank');
select tests.reset_role();
insert into public.space_members (space_id, user_id)
  select id, tests.user_id('ben') from public.spaces where created_by = tests.user_id('ana');
insert into public.ideas (space_id, title, created_by)
  select id, 'Bens idea', tests.user_id('ben')
  from public.spaces where created_by = tests.user_id('ana');
create temp table who as
  select handle, tests.user_id(handle) as id from unnest(array['ana', 'ben', 'cal']) handle;
grant select on who to authenticated;
create temp table solo as select id from public.spaces where created_by = tests.user_id('cal');

-- tests.act_as sets no iat; these claims carry one, aged by the given number of seconds.
create function pg_temp.act_fresh(handle text, age int) returns void language sql as $$
  select tests.act_as(handle);
  select set_config('request.jwt.claims', json_build_object('sub', tests.user_id(handle),
    'role', 'authenticated', 'iat', extract(epoch from now())::bigint - age)::text, true);
$$;

select throws_ok($$ select public.delete_my_account() $$, '28000', null,
  'signed-out callers cannot delete');

select tests.act_as('ana');
select throws_ok($$ select public.delete_my_account() $$, 'P0001',
  'please confirm your password again', 'a token without iat is not recent');
select pg_temp.act_fresh('ana', 600);
select throws_ok($$ select public.delete_my_account() $$, 'P0001',
  'please confirm your password again', 'a stale sign-in must reauthenticate');
select pg_temp.act_fresh('ana', 5);
select throws_ok($$ select public.delete_my_account() $$, 'P0001',
  'transfer ownership or delete your shared spaces first', 'owner of a shared space is blocked');

select pg_temp.act_fresh('cal', 5);
select lives_ok($$ select public.delete_my_account() $$, 'a solo owner deletes the account');
select tests.reset_role();
select is((select count(*) from public.spaces where id in (select id from solo))::int, 0,
  'spaces owned alone are deleted');
select is((select count(*) from public.profiles where id = (select id from who where handle = 'cal'))::int,
  0, 'profile is gone');
select is((select count(*) from auth.users where id = (select id from who where handle = 'cal'))::int,
  0, 'auth user is gone');

select pg_temp.act_fresh('ben', 5);
select lives_ok($$ select public.delete_my_account() $$, 'a plain member deletes the account');

select tests.act_as('ana');
select is((select title from public.ideas where created_by is null and title = 'Bens idea'), 'Bens idea',
  'authored content stays, attributed to nobody');
select is((select count(*) from public.space_members)::int, 1, 'membership is gone');
select ok(exists (select 1 from public.activity_events where event_type = 'member_left'),
  'the remaining members see that someone left');
select tests.reset_role();
select is((select count(*) from auth.users where id = (select id from who where handle = 'ben'))::int,
  0, 'deleted member auth user is gone');

select * from finish();
rollback;
