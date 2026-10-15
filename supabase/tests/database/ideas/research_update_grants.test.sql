-- Research rows can be updated only where the app updates them: a hypothesis's status.
begin;
select plan(5);

select tests.create_user('grant_owner_rg');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-0000000005a7', 'Grants');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000005a7', tests.user_id('grant_owner_rg'), 'owner');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000005a8', '00000000-0000-0000-0000-0000000005a7', 'Kiosk');

select tests.act_as('grant_owner_rg');
insert into public.idea_notes (space_id, idea_id, body)
  values ('00000000-0000-0000-0000-0000000005a7', '00000000-0000-0000-0000-0000000005a8', 'Ask');
insert into public.research_links (space_id, idea_id, url, title)
  values ('00000000-0000-0000-0000-0000000005a7', '00000000-0000-0000-0000-0000000005a8',
    'https://grants.test', 'Rent');
insert into public.hypotheses (space_id, idea_id, statement)
  values ('00000000-0000-0000-0000-0000000005a7', '00000000-0000-0000-0000-0000000005a8', 'Sells');

select throws_ok($$update public.idea_notes set body = 'Edited'$$, '42501', null,
  'a note body cannot be edited');
select throws_ok($$update public.research_links set url = 'https://elsewhere.test'$$, '42501', null,
  'a research link cannot be edited');
select throws_ok($$update public.hypotheses set statement = 'Edited'$$, '42501', null,
  'a hypothesis statement cannot be edited');
select lives_ok($$update public.hypotheses set status = 'validated'$$,
  'the hypothesis status can still be set');
select is((select status::text from public.hypotheses), 'validated', 'the status change was saved');

select * from finish();
rollback;
