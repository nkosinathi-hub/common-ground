-- D06: a member changes an idea's template; a non-member cannot.
begin;
select plan(2);
select tests.create_user('tpl_ana'), tests.create_user('tpl_eve');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-00000000075a', 'Ours');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000075a', tests.user_id('tpl_ana'), 'owner');
select tests.act_as('tpl_ana');
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000075de', '00000000-0000-0000-0000-00000000075a', 'Cafe');
update public.ideas set template = 'business' where id = '00000000-0000-0000-0000-0000000075de';
select is((select template::text from public.ideas where id = '00000000-0000-0000-0000-0000000075de'),
  'business', 'a member changes the template');
select tests.act_as('tpl_eve');
update public.ideas set template = 'creative' where id = '00000000-0000-0000-0000-0000000075de';
select tests.reset_role();
select is((select template::text from public.ideas where id = '00000000-0000-0000-0000-0000000075de'),
  'business', 'a non-member cannot');
select * from finish();
rollback;
