-- Revoked invitations stay dead, tokens are single-use, and one space's owner cannot touch another's.
begin;
select plan(10);

select tests.create_user('inv_ana'), tests.create_user('inv_bob'), tests.create_user('inv_cy'),
  tests.create_user('inv_dee');
select tests.act_as('inv_ana');
create temp table ctx (a uuid, b uuid, revoked text, used text, invite uuid);
grant all on ctx to authenticated;
insert into ctx (a) select public.create_space('Ana space', 'blank');
update ctx set revoked = public.create_invite(a), used = public.create_invite(a);
-- Both links share one transaction's now(), so pick the one to revoke by its token, not its time.
select tests.reset_role();
update ctx set invite = (select id from public.space_invites
  where token_hash = public.hash_invite_token((select revoked from ctx)));
select tests.act_as('inv_ana');
select tests.act_as('inv_bob');
update ctx set b = public.create_space('Bob space', 'blank');

select throws_ok($$ select public.revoke_invite((select invite from ctx)) $$, 'P0002', null,
  'another space''s owner cannot revoke an invite');
select throws_ok($$ select public.create_invite((select a from ctx)) $$, '42501', null,
  'another space''s owner cannot invite into it');
select is((select count(*)::int from public.space_invites where space_id = (select a from ctx)), 0,
  'another space''s owner cannot list its invites');

select tests.act_as('inv_ana');
select lives_ok($$ select public.revoke_invite((select invite from ctx)) $$, 'the owner revokes');
select throws_ok($$ select public.revoke_invite((select invite from ctx)) $$, 'P0002', null,
  'a revoked invite cannot be revoked again');
select throws_ok($$ update public.space_invites set revoked_at = null $$, '42501', null,
  'invite state is not directly writable');

select tests.act_as('inv_cy');
select is((select status from public.invite_preview((select revoked from ctx))), 'revoked',
  'a revoked link previews as revoked');
select throws_ok($$ select public.redeem_invite((select revoked from ctx)) $$, 'P0001',
  'this invitation is no longer valid', 'a revoked link cannot be redeemed');
select lives_ok($$ select public.redeem_invite((select used from ctx)) $$, 'a valid link is redeemed once');

select tests.act_as('inv_dee');
select throws_ok($$ select public.redeem_invite((select used from ctx)) $$, 'P0001',
  'this invitation is no longer valid', 'the same link cannot be redeemed twice');

select * from finish();
rollback;
