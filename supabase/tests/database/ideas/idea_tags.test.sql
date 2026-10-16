-- Each tag is 1 to 40 characters, as the client's TAG_MAX says.
begin;
select plan(4);

select tests.create_user('tag_ana');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-0000000007a1', 'Tags');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000007a1', tests.user_id('tag_ana'), 'owner');

select tests.act_as('tag_ana');
select lives_ok($$insert into public.ideas (space_id, title, tags)
  values ('00000000-0000-0000-0000-0000000007a1', 'Fine', array['zine', repeat('a', 40)])$$,
  'tags up to 40 characters are kept');
select throws_ok($$insert into public.ideas (space_id, title, tags)
  values ('00000000-0000-0000-0000-0000000007a1', 'Long', array['zine', repeat('a', 41)])$$,
  '23514', null, 'a tag over 40 characters is refused');
select throws_ok($$insert into public.ideas (space_id, title, tags)
  values ('00000000-0000-0000-0000-0000000007a1', 'Empty', array[''])$$,
  '23514', null, 'an empty tag is refused');
select throws_ok($$update public.ideas set tags = array[repeat('b', 41)] where title = 'Fine'$$,
  '23514', null, 'a long tag is refused on update too');

select * from finish();
rollback;
