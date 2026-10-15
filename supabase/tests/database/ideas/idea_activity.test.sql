-- Idea work leaves a trail in the space activity feed.
begin;
select plan(5);

select tests.create_user('activity_ana');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000005a', 'Ours');
insert into public.space_members (space_id, user_id, role)
  values ('00000000-0000-0000-0000-00000000005a', tests.user_id('activity_ana'), 'owner');

select tests.act_as('activity_ana');
insert into public.ideas (id, space_id, title)
  values ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar');
update public.ideas set stage = 'exploring';
update public.ideas set title = 'Tea bar 2';
insert into public.tasks (id, space_id, idea_id, title) values ('00000000-0000-0000-0000-00000000007a',
  '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Lease');
update public.tasks set status = 'done';
insert into public.milestones (space_id, idea_id, title)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Open');
update public.milestones set completed_at = now();

create temp table seen as select event_type, count(*)::int as n from public.activity_events
  where space_id = '00000000-0000-0000-0000-00000000005a' group by 1;
select is((select n from seen where event_type = 'idea_created'), 1, 'idea created');
select is((select n from seen where event_type = 'idea_stage_changed'), 1, 'stage change only, not other edits');
select is((select n from seen where event_type = 'task_created'), 1, 'task created');
select is((select n from seen where event_type = 'task_completed'), 1, 'task completed');
select is((select n from seen where event_type = 'milestone_completed'), 1, 'milestone completed');

select * from finish();
rollback;
