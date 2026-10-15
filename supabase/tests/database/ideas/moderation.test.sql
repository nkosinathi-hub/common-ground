-- Only the author or the space owner deletes idea content; other members cannot.
begin;
select plan(6);

select tests.create_user('mod_ana'), tests.create_user('mod_ben'), tests.create_user('mod_dee');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000005a', 'Ours');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('mod_ana'), 'owner'),
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('mod_ben'), 'member'),
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('mod_dee'), 'member');

select tests.act_as('mod_ben');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar'),
  ('00000000-0000-0000-0000-0000000002de', '00000000-0000-0000-0000-00000000005a', 'Zine');
insert into public.idea_notes (space_id, idea_id, body)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Note');
insert into public.tasks (id, space_id, idea_id, title) values ('00000000-0000-0000-0000-00000000007a',
  '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Lease');
insert into public.task_checklist_items (space_id, task_id, label)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-00000000007a', 'Sign');
insert into public.budget_entries (space_id, idea_id, category, label) values
  ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Rent', 'Deposit');
insert into public.milestones (space_id, idea_id, title)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Open');

select tests.act_as('mod_dee');
delete from public.idea_notes; delete from public.task_checklist_items; delete from public.tasks;
delete from public.budget_entries; delete from public.milestones; delete from public.ideas;
select is((select count(*)::int from public.ideas), 2, 'another member cannot delete ideas');
select is((select count(*)::int from public.idea_notes) + (select count(*)::int from public.tasks)
  + (select count(*)::int from public.task_checklist_items) + (select count(*)::int from public.budget_entries)
  + (select count(*)::int from public.milestones), 5, 'another member cannot delete idea content');
select is((select created_by from public.task_checklist_items), tests.user_id('mod_ben'), 'checklist items record their author');
update public.tasks set title = 'Lease soon';
select is((select title from public.tasks), 'Lease soon', 'other members can still edit');

select tests.act_as('mod_ben');
delete from public.task_checklist_items;
select is((select count(*)::int from public.task_checklist_items), 0, 'the author deletes their own content');

select tests.act_as('mod_ana');
delete from public.ideas where id = '00000000-0000-0000-0000-0000000002de';
select is((select count(*)::int from public.ideas), 1, 'the space owner deletes any idea');

select * from finish();
rollback;
