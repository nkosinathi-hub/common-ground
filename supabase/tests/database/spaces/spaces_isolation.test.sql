begin;
select plan(9);

select tests.create_user('ana');
select tests.create_user('eve');
select tests.act_as('ana');
create temp table target (id uuid);
grant all on target to authenticated;
insert into target select public.create_space('Private', 'blank');

select tests.act_as('eve');
select is((select count(*) from public.spaces)::int, 0, 'nonmember sees no spaces');
select is((select count(*) from public.space_members)::int, 0, 'nonmember sees no memberships');
select is((select count(*) from public.profiles)::int, 1, 'nonmember sees only own profile');
select is((select count(*) from public.activity_events)::int, 0, 'nonmember sees no activity');

select tests.reset_role();

select tests.act_as('eve');
update public.spaces set name = 'Hacked' where id = (select id from target);
select tests.reset_role();
select is((select name from public.spaces where id = (select id from target)), 'Private', 'guessed id update has no effect');

select tests.act_as('eve');
select throws_ok($$ insert into public.space_members (space_id, user_id)
  values ((select id from target), tests.user_id('eve')) $$, '42501', null, 'cannot self-join');
select throws_ok($$ select public.delete_space((select id from target), 'Private') $$,
  '42501', null, 'cannot delete a stranger''s space');
select throws_ok($$ select public.notify(tests.user_id('ana'), (select id from target), 'x_y_z', 'space',
  (select id from target), 'k') $$, '42501', null, 'clients cannot forge notifications');

select tests.act_as_anon();
select throws_ok($$ select count(*) from public.spaces $$, '42501', null, 'anon has no access');

select * from finish();
rollback;
