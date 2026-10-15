begin;
select plan(8);

select tests.create_user('ana');
select tests.create_user('ben');

select tests.act_as('ana');
select public.create_space('Us', 'couple');
select tests.reset_role();
create temp table space_ref as select id from public.spaces where created_by = tests.user_id('ana');
insert into public.space_members (space_id, user_id) select id, tests.user_id('ben') from space_ref;
insert into public.ideas (space_id, title, created_by)
  select id, t, tests.user_id('ana') from space_ref, unnest(array['One', 'Two']) t;
insert into public.ideas (space_id, title, created_by)
  select id, 'Three', tests.user_id('ben') from space_ref;

select throws_ok($$ select public.export_me() $$, '28000', null, 'signed-out callers cannot export');

select tests.act_as('ana');
select is(public.export_me() ->> 'email', 'ana@test.local', 'export carries the sign-in email');
select is(public.export_me() #>> '{profile,display_name}', 'ana', 'export carries the profile');
select is(jsonb_array_length(public.export_me() -> 'memberships'), 1, 'one membership');
select is(public.export_me() #>> '{memberships,0,name}', 'Us', 'membership names the space');
select is(public.export_me() #>> '{memberships,0,role}', 'owner', 'membership carries the role');
select is((public.export_me() #>> '{counts,ideas}')::int, 2, 'counts only rows the caller authored');
select ok(not (public.export_me() -> 'counts' ? 'activity_events'),
  'tables without an author column are not counted');

select * from finish();
rollback;
