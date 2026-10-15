-- The overview is written only through update_idea_brief, which refuses stale writes.
begin;
select plan(6);

select tests.create_user('ana'), tests.create_user('cy');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000005a', 'Ours');
insert into public.space_members (space_id, user_id, role)
  values ('00000000-0000-0000-0000-00000000005a', tests.user_id('ana'), 'owner');
insert into public.ideas (id, space_id, title, updated_at) values
  ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar',
   '2026-10-15 10:00:00+00');

select tests.act_as('ana');
select throws_ok(
  $$update public.ideas set brief = '{"pitch":"x"}'$$, '42501', null, 'brief is not directly writable');
select throws_ok(
  $$select public.update_idea_brief('00000000-0000-0000-0000-0000000001de',
    '2026-10-15 09:00:00+00', '{"pitch":"stale"}')$$,
  '40001', null, 'stale expected_updated_at is a conflict');
select ok(
  public.update_idea_brief('00000000-0000-0000-0000-0000000001de',
    '2026-10-15 10:00:00+00', '{"pitch":"Fresh","nextStep":"Call"}') is not null,
  'current expected_updated_at succeeds');
select is((select brief ->> 'pitch' from public.ideas), 'Fresh', 'brief saved');
select throws_ok(
  $$select public.update_idea_brief('00000000-0000-0000-0000-0000000001de',
    (select updated_at from public.ideas), jsonb_build_object('pitch', repeat('x', 4001)))$$,
  '23514', null, 'fields are capped at 4000 characters');

select tests.act_as('cy');
select throws_ok(
  $$select public.update_idea_brief('00000000-0000-0000-0000-0000000001de',
    '2026-10-15 10:00:00+00', '{}')$$,
  '42501', null, 'nonmember cannot write the brief');

select * from finish();
rollback;
