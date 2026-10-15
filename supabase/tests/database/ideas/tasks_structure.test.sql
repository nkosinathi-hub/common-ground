-- Milestones, tasks and checklist items stay inside one space; dates are plain dates.
begin;
select plan(7);

select tests.create_user('ana'), tests.create_user('cy');
insert into public.spaces (id, name) values
  ('00000000-0000-0000-0000-00000000005a', 'Ours'), ('00000000-0000-0000-0000-00000000005b', 'Other');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('ana'), 'owner'),
  ('00000000-0000-0000-0000-00000000005b', tests.user_id('ana'), 'owner');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar'),
  ('00000000-0000-0000-0000-0000000002de', '00000000-0000-0000-0000-00000000005b', 'Zine');

select tests.act_as('ana');
insert into public.milestones (id, space_id, idea_id, title, target_date) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-00000000005b',
   '00000000-0000-0000-0000-0000000002de', 'Print run', '2026-12-01');
select throws_ok(
  $$insert into public.tasks (space_id, idea_id, title, milestone_id) values
    ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'X',
     '00000000-0000-0000-0000-0000000000a5')$$,
  '23503', null, 'a task cannot use a milestone from another space');

insert into public.milestones (id, space_id, idea_id, title) values
  ('00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-00000000005a',
   '00000000-0000-0000-0000-0000000001de', 'Open');
insert into public.tasks (id, space_id, idea_id, title, due_date, milestone_id) values
  ('00000000-0000-0000-0000-00000000007a', '00000000-0000-0000-0000-00000000005a',
   '00000000-0000-0000-0000-0000000001de', 'Lease', '2026-10-15', '00000000-0000-0000-0000-0000000000a6');
set local timezone = 'Pacific/Auckland';
select is((select due_date::text from public.tasks), '2026-10-15', 'due date stable in Auckland');
set local timezone = 'America/Los_Angeles';
select is((select due_date::text from public.tasks), '2026-10-15', 'due date stable in Los Angeles');
select is((select target_date::text from public.milestones where title = 'Print run'), '2026-12-01', 'target date is a plain date');

insert into public.task_checklist_items (space_id, task_id, label) values
  ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-00000000007a', 'Sign');
select throws_ok(
  $$insert into public.task_checklist_items (space_id, task_id, label) values
    ('00000000-0000-0000-0000-00000000005b', '00000000-0000-0000-0000-00000000007a', 'X')$$,
  '23503', null, 'checklist item cannot cross spaces');

delete from public.milestones;
select is((select count(*)::int || ':' || coalesce(max(milestone_id::text), 'none') from public.tasks),
  '1:none', 'deleting a milestone keeps its tasks and unlinks them');

select tests.act_as('cy');
select is((select count(*)::int from public.milestones) + (select count(*)::int from public.task_checklist_items),
  0, 'nonmember sees no milestones or checklist items');

select * from finish();
rollback;
