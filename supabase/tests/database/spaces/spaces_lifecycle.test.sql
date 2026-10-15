begin;
select plan(10);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('eve');

select tests.act_as('ana');
select lives_ok($$ select public.create_space('Us', 'couple') $$, 'a user creates a space');
select is((select count(*) from public.spaces)::int, 1, 'creator sees the space');
select is((select role::text from public.space_members where user_id = tests.user_id('ana')), 'owner',
  'creator is the owner');
select throws_ok($$ select public.leave_space((select id from public.spaces limit 1)) $$,
  'P0001', null, 'last owner cannot leave');

-- ben joins directly (invites are tested separately)
select tests.reset_role();
insert into public.space_members (space_id, user_id) select id, tests.user_id('ben') from public.spaces;

select tests.act_as('ben');
select throws_ok($$ select public.remove_member((select id from public.spaces limit 1), tests.user_id('ana')) $$,
  '42501', null, 'members cannot remove others');
select is((select count(*) from public.profiles)::int, 2, 'members see each other''s profiles');

select tests.act_as('ana');
select lives_ok($$ select public.transfer_ownership((select id from public.spaces limit 1), tests.user_id('ben')) $$,
  'owner transfers ownership');
select lives_ok($$ select public.leave_space((select id from public.spaces limit 1)) $$,
  'former owner can now leave');
select is((select count(*) from public.spaces)::int, 0, 'after leaving, the space is invisible');

select tests.act_as('ben');
select throws_ok($$ select public.delete_space((select id from public.spaces limit 1), 'Wrong') $$,
  'P0001', null, 'delete requires the exact space name');

select * from finish();
rollback;
