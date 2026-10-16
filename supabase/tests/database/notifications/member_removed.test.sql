-- A removed member hears about it once; leaving on your own sends them nothing.
begin;
select plan(5);

select tests.create_user('mrm_ana'); select tests.create_user('mrm_ben'); select tests.create_user('mrm_cy');
insert into public.spaces (id, name) values ('d7000000-0000-4000-8000-000000000001', 'Us');
insert into public.space_members (space_id, user_id, role) values
  ('d7000000-0000-4000-8000-000000000001', tests.user_id('mrm_ana'), 'owner'),
  ('d7000000-0000-4000-8000-000000000001', tests.user_id('mrm_ben'), 'member'),
  ('d7000000-0000-4000-8000-000000000001', tests.user_id('mrm_cy'), 'member');

select tests.act_as('mrm_ana');
select public.remove_member('d7000000-0000-4000-8000-000000000001', tests.user_id('mrm_ben'));
select tests.reset_role();
select is((select count(*)::int from public.notifications where recipient_id = tests.user_id('mrm_ben')
    and type = 'member_removed' and subject_type = 'space'
    and subject_id = 'd7000000-0000-4000-8000-000000000001'
    and actor_id = tests.user_id('mrm_ana')
    and deduplication_key like 'member_removed:d7000000-0000-4000-8000-000000000001:'
      || tests.user_id('mrm_ben') || ':%'), 1, 'the removed member is told once');

select tests.act_as('mrm_ben');
select is((select count(*)::int from public.notifications where type = 'member_removed'), 1,
  'the removed member can read it after losing access');
select is((select count(*)::int from public.spaces), 0, 'but no longer sees the space');

select tests.act_as('mrm_cy');
select public.leave_space('d7000000-0000-4000-8000-000000000001');
select tests.reset_role();
select is((select count(*)::int from public.notifications where recipient_id = tests.user_id('mrm_cy')),
  0, 'leaving sends no member_removed');

select tests.act_as('mrm_ana');
select throws_ok($$ select public.remove_member('d7000000-0000-4000-8000-000000000001',
  tests.user_id('mrm_cy')) $$, 'P0002', null, 'removing a non-member still fails');

select * from finish();
rollback;
