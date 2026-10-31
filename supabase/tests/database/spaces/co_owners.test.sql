-- Co-owners: owners add owners, step down or remove one while one remains, and leave when not last.
begin;
select plan(9);

select tests.create_user('co_ana'); select tests.create_user('co_ben'); select tests.create_user('co_cy');
select tests.act_as('co_ana');
create temp table ctx (space_id uuid);
grant select on ctx to authenticated;
insert into ctx select public.create_space('Us', 'couple');
select tests.reset_role();
insert into public.space_members (space_id, user_id) select space_id, tests.user_id(h)
  from ctx, unnest(array['co_ben', 'co_cy']) h;

select tests.act_as('co_ben');
select throws_ok($$ select public.make_owner((select space_id from ctx), tests.user_id('co_cy')) $$,
  '42501', null, 'a member cannot add owners');
select tests.act_as('co_ana');
select lives_ok($$ select public.make_owner((select space_id from ctx), tests.user_id('co_ben')) $$,
  'an owner adds an owner');
select is((select count(*)::int from public.space_members where role = 'owner'
  and space_id = (select space_id from ctx)), 2, 'both are owners now');

select tests.act_as('co_ben');
select lives_ok($$ select public.remove_owner((select space_id from ctx), tests.user_id('co_ana')) $$,
  'a co-owner can remove another owner');
select throws_ok($$ select public.remove_owner((select space_id from ctx), tests.user_id('co_ben')) $$,
  'P0001', null, 'the last owner cannot step down');
select throws_ok($$ select public.leave_space((select space_id from ctx)) $$, 'P0001', null,
  'the last owner cannot leave');
select lives_ok($$ select public.make_owner((select space_id from ctx), tests.user_id('co_ana')) $$,
  'owners again');
select lives_ok($$ select public.leave_space((select space_id from ctx)) $$,
  'an owner leaves while another owner remains');
select tests.act_as('co_ana');
select is((select role::text from public.space_members where user_id = tests.user_id('co_ana')
  and space_id = (select space_id from ctx)), 'owner', 'the remaining owner keeps the space');

select * from finish();
rollback;
