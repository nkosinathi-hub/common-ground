-- Task assignee must be a member, is notified once, and is cleared when the member leaves.
begin;
select plan(8);

select tests.create_user('ana'), tests.create_user('ben'), tests.create_user('cy');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000005a', 'Ours');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('ana'), 'owner'),
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('ben'), 'member');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar');

select tests.act_as('ana');
insert into public.tasks (id, space_id, idea_id, title, assignee_id) values
  ('00000000-0000-0000-0000-00000000007a', '00000000-0000-0000-0000-00000000005a',
   '00000000-0000-0000-0000-0000000001de', 'Find a site', tests.user_id('ben'));
select is((select status::text || '/' || priority::text from public.tasks), 'backlog/medium', 'defaults');
update public.tasks set title = 'Find a site soon';
update public.tasks set assignee_id = tests.user_id('ben');

select tests.reset_role();
select is((select count(*)::int from public.notifications where recipient_id = tests.user_id('ben')
  and deduplication_key = 'task_assigned:00000000-0000-0000-0000-00000000007a:' || tests.user_id('ben')),
  1, 'assignee notified exactly once');
select is((select type from public.notifications limit 1), 'task_assigned', 'notification type');

select tests.act_as('ana');
select throws_ok(
  $$update public.tasks set assignee_id = tests.user_id('cy')$$,
  'P0001', 'assignee must be a member of this space', 'nonmember cannot be assigned');
update public.tasks set assignee_id = tests.user_id('ana');
select is((select count(*)::int from public.notifications), 0, 'self-assignment does not notify (own view)');

update public.tasks set assignee_id = tests.user_id('ben');
select public.remove_member('00000000-0000-0000-0000-00000000005a', tests.user_id('ben'));
select is((select assignee_id from public.tasks), null, 'assignee cleared when the member is removed');

select tests.act_as('ben');
select is((select count(*)::int from public.tasks), 0, 'removed member sees no tasks');
select tests.act_as('cy');
select is((select count(*)::int from public.tasks), 0, 'nonmember sees no tasks');

select * from finish();
rollback;
