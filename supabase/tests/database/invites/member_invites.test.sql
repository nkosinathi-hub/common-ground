-- v0.6: members invite and see the space's links; they revoke only their own, the owner any.
begin;
select plan(8);

select tests.create_user('mi_ana'), tests.create_user('mi_ben'), tests.create_user('mi_cat'),
  tests.create_user('mi_eve');
select tests.act_as('mi_ana');
create temp table ctx (space_id uuid, ana_link uuid, ben_link uuid, cat_link uuid);
grant all on ctx to authenticated;
insert into ctx (space_id) select public.create_space('Us', 'blank');
select tests.reset_role();
insert into public.space_members (space_id, user_id, role)
  select space_id, tests.user_id(h), 'member' from ctx, unnest(array['mi_ben', 'mi_cat']) h;

select tests.act_as('mi_ana');
select public.create_invite((select space_id from ctx));
update ctx set ana_link = (select id from public.space_invites where created_by = tests.user_id('mi_ana'));
select tests.act_as('mi_ben');
select lives_ok($$ select public.create_invite((select space_id from ctx)) $$, 'a member invites');
update ctx set ben_link = (select id from public.space_invites where created_by = tests.user_id('mi_ben'));
select tests.act_as('mi_cat');
select public.create_invite((select space_id from ctx));
update ctx set cat_link = (select id from public.space_invites where created_by = tests.user_id('mi_cat'));
select is((select count(*)::int from public.space_invites), 3, 'members see every link in the space');

select tests.act_as('mi_ben');
select throws_ok($$ select public.revoke_invite((select cat_link from ctx)) $$, 'P0002', null,
  'a member cannot revoke another member''s link');
select throws_ok($$ select public.revoke_invite((select ana_link from ctx)) $$, 'P0002', null,
  'a member cannot revoke the owner''s link');
select lives_ok($$ select public.revoke_invite((select ben_link from ctx)) $$,
  'a member revokes their own link');

select tests.act_as('mi_ana');
select lives_ok($$ select public.revoke_invite((select cat_link from ctx)) $$,
  'the owner revokes any link');

select tests.act_as('mi_eve');
select throws_ok($$ select public.create_invite((select space_id from ctx)) $$, '42501', null,
  'a stranger cannot invite');
select is((select count(*)::int from public.space_invites), 0, 'a stranger sees no links');

select * from finish();
rollback;
