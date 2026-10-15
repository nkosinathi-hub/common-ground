-- Same-idea milestones, budget caps, who may clear budget lines, and re-notifying a returning assignee.
begin;
select plan(6);

select tests.create_user('rules_ana'), tests.create_user('rules_ben'), tests.create_user('rules_dee');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000005a', 'Ours');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('rules_ana'), 'owner'),
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('rules_ben'), 'member'),
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('rules_dee'), 'member');

select tests.act_as('rules_ben');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar'),
  ('00000000-0000-0000-0000-0000000002de', '00000000-0000-0000-0000-00000000005a', 'Zine');
insert into public.milestones (id, space_id, idea_id, title) values ('00000000-0000-0000-0000-0000000000a5',
  '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000002de', 'Print');
select throws_ok(
  $$insert into public.tasks (space_id, idea_id, title, milestone_id) values ('00000000-0000-0000-0000-00000000005a',
    '00000000-0000-0000-0000-0000000001de', 'X', '00000000-0000-0000-0000-0000000000a5')$$,
  '23503', null, 'a task cannot use a milestone of another idea');
select throws_ok(
  $$insert into public.budget_entries (space_id, idea_id, category, label, estimated_minor) values
    ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'R', 'L', 100000000000000)$$,
  '23514', null, 'amounts stay within the safe integer range');

insert into public.budget_entries (space_id, idea_id, category, label) values
  ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Rent', 'Deposit');
select tests.act_as('rules_dee');
select throws_ok(
  $$select public.change_idea_currency('00000000-0000-0000-0000-0000000001de', 'USD', true)$$,
  '42501', null, 'only the author or owner may clear budget lines');
select tests.act_as('rules_ana');
select lives_ok(
  $$select public.change_idea_currency('00000000-0000-0000-0000-0000000001de', 'USD', true)$$,
  'the space owner may clear budget lines');

insert into public.tasks (id, space_id, idea_id, title, assignee_id) values ('00000000-0000-0000-0000-00000000007a',
  '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Lease', tests.user_id('rules_ben'));
update public.tasks set assignee_id = tests.user_id('rules_dee');
update public.tasks set assignee_id = tests.user_id('rules_ben');
select tests.reset_role();
select is((select count(*)::int from public.notifications
  where recipient_id = tests.user_id('rules_ben') and subject_id = '00000000-0000-0000-0000-00000000007a'), 2, 'a returning assignee is notified again');
select is((select count(*)::int from public.notifications
  where recipient_id = tests.user_id('rules_dee') and subject_id = '00000000-0000-0000-0000-00000000007a'), 1, 'each assignment notifies once');

select * from finish();
rollback;
