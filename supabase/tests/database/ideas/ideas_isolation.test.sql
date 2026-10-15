-- Ideas are visible and writable only to current members of the idea's space.
begin;
select plan(7);

select tests.create_user('ana'), tests.create_user('ben'), tests.create_user('cy');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000005a', 'Ours');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('ana'), 'owner'),
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('ben'), 'member');

select tests.act_as('ana');
insert into public.ideas (space_id, title) values ('00000000-0000-0000-0000-00000000005a', 'Tea bar');
select is((select stage::text from public.ideas), 'inbox', 'quick capture defaults to inbox');
select is((select currency from public.ideas), 'ZAR', 'currency defaults to ZAR');
select is((select created_by from public.ideas), tests.user_id('ana'), 'author is the caller');
select throws_ok(
  $$insert into public.ideas (space_id, title, brief)
    values ('00000000-0000-0000-0000-00000000005a', 'X', '{"bogus":"y"}')$$,
  '23514', null, 'brief rejects unknown keys');

select tests.act_as('cy');
select is((select count(*)::int from public.ideas), 0, 'nonmember sees no ideas');
select throws_ok(
  $$insert into public.ideas (space_id, title) values ('00000000-0000-0000-0000-00000000005a', 'X')$$,
  '42501', null, 'nonmember cannot capture');

select tests.reset_role();
delete from public.space_members where user_id = tests.user_id('ben');
select tests.act_as('ben');
select is((select count(*)::int from public.ideas), 0, 'removed member sees no ideas');

select * from finish();
rollback;
