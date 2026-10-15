-- Budget amounts are non-negative minor units; currency changes only when no entries remain.
begin;
select plan(9);

select tests.create_user('ana'), tests.create_user('cy');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000005a', 'Ours');
insert into public.space_members (space_id, user_id, role)
  values ('00000000-0000-0000-0000-00000000005a', tests.user_id('ana'), 'owner');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000001de', '00000000-0000-0000-0000-00000000005a', 'Tea bar');

select tests.act_as('ana');
insert into public.budget_entries (space_id, idea_id, category, label, estimated_minor, actual_minor)
  values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'Rent', 'Deposit', 1500000, 0);
select throws_ok(
  $$insert into public.budget_entries (space_id, idea_id, category, label, estimated_minor)
    values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000001de', 'X', 'Y', -1)$$,
  '23514', null, 'negative estimate rejected');
select throws_ok(
  $$update public.budget_entries set actual_minor = -5$$, '23514', null, 'negative actual rejected');
select throws_ok(
  $$update public.ideas set currency = 'USD'$$, '42501', null, 'currency is not directly writable');
select throws_ok(
  $$select public.change_idea_currency('00000000-0000-0000-0000-0000000001de', 'USD', false)$$,
  'P0001', 'clear the budget entries before changing currency', 'blocked while entries exist');
select is((select currency from public.ideas), 'ZAR', 'currency unchanged');
select throws_ok(
  $$select public.change_idea_currency('00000000-0000-0000-0000-0000000001de', 'usd', true)$$,
  'P0001', 'use a three-letter ISO currency code', 'lower-case code rejected');
select lives_ok(
  $$select public.change_idea_currency('00000000-0000-0000-0000-0000000001de', 'USD', true)$$,
  'explicit clear changes currency');
select is((select currency || ':' || (select count(*) from public.budget_entries) from public.ideas),
  'USD:0', 'entries cleared and currency changed');

select tests.act_as('cy');
select throws_ok(
  $$select public.change_idea_currency('00000000-0000-0000-0000-0000000001de', 'EUR', true)$$,
  '42501', null, 'nonmember cannot change currency');

select * from finish();
rollback;
