-- Notes, research links and hypotheses: members only, and never attached across spaces.
begin;
select plan(10);

select tests.create_user('ana'), tests.create_user('ben'), tests.create_user('cy');
insert into public.spaces (id, name) values
  ('00000000-0000-0000-0000-00000000005a', 'Ours'), ('00000000-0000-0000-0000-00000000005b', 'Other');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('ana'), 'owner'),
  ('00000000-0000-0000-0000-00000000005a', tests.user_id('ben'), 'member'),
  ('00000000-0000-0000-0000-00000000005b', tests.user_id('ana'), 'owner');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar');

select tests.act_as('ana');
insert into public.idea_notes (space_id, idea_id, body)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Call the landlord');
insert into public.research_links (space_id, idea_id, url, title)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'https://x.test', 'Rent');
insert into public.hypotheses (space_id, idea_id, statement)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'People pay R40');
select is((select status::text from public.hypotheses), 'untested', 'hypotheses start untested');
select throws_ok(
  $$insert into public.research_links (space_id, idea_id, url, title) values
    ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'ftp://x.test', 'F')$$,
  '23514', null, 'ftp links are rejected');
select throws_ok(
  $$insert into public.research_links (space_id, idea_id, url, title) values
    ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'javascript:alert(1)', 'J')$$,
  '23514', null, 'javascript links are rejected');
select throws_ok(
  $$insert into public.idea_notes (space_id, idea_id, body) values
    ('00000000-0000-0000-0000-00000000005b', '00000000-0000-0000-0000-0000000001de', 'Sneaky')$$,
  '23503', null, 'a note cannot point at an idea in another space');

select tests.act_as('cy');
select is((select count(*)::int from public.idea_notes), 0, 'nonmember sees no notes');
select is((select count(*)::int from public.research_links), 0, 'nonmember sees no links');
select is((select count(*)::int from public.hypotheses), 0, 'nonmember sees no hypotheses');
select throws_ok(
  $$insert into public.hypotheses (space_id, idea_id, statement) values
    ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'X')$$,
  '42501', null, 'nonmember cannot add a hypothesis');

select tests.reset_role();
delete from public.space_members where user_id = tests.user_id('ben');
select tests.act_as('ben');
select is((select count(*)::int from public.idea_notes) + (select count(*)::int from public.research_links)
  + (select count(*)::int from public.hypotheses), 0, 'removed member sees none of them');
select throws_ok(
  $$update public.idea_notes set created_by = null$$, '42501', null, 'author is not writable');

select * from finish();
rollback;
