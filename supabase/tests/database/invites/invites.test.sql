begin;
select plan(12);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('cat');
select tests.create_user('eve');
select tests.act_as('ana');
create temp table ctx (space_id uuid);
grant all on ctx to authenticated;
insert into ctx select public.create_space('Us', 'couple');
create temp table t (token text);
grant all on t to authenticated;
insert into t select public.create_invite((select space_id from ctx));

select is((select count(*) from public.space_invites)::int, 1, 'owner sees the invite');
select throws_ok($$ select token_hash from public.space_invites $$, '42501', null, 'hash is not readable');

select tests.act_as('eve');
select is((select count(*) from public.space_invites)::int, 0, 'strangers cannot list invites');
select throws_ok($$ select public.create_invite((select space_id from public.space_members limit 1)) $$,
  '42501', null, 'strangers cannot invite');

select tests.act_as('ben');
select is((select status from public.invite_preview((select token from t))), 'valid', 'preview shows valid');
select is((select status from public.invite_preview('wrong-token-value')), 'invalid', 'wrong token is invalid');
select lives_ok($$ select public.redeem_invite((select token from t)) $$, 'ben redeems');
select is((select count(*) from public.spaces)::int, 1, 'ben now sees the space');

select tests.act_as('cat');
select throws_ok($$ select public.redeem_invite((select token from t)) $$, 'P0001', null, 'reuse fails');

select tests.act_as('ana');
select is((select count(*) from public.notifications)::int, 1, 'owner notified of acceptance');

-- removed member can rejoin with a fresh invite
select public.remove_member((select space_id from ctx), tests.user_id('ben'));
update t set token = public.create_invite((select space_id from ctx));
select tests.act_as('ben');
select lives_ok($$ select public.redeem_invite((select token from t)) $$, 'removed member rejoins');

-- expired invites fail
select tests.reset_role();
update public.space_invites set expires_at = now() - interval '1 minute', redeemed_at = null, revoked_at = null where space_id = (select space_id from ctx);
select tests.act_as('cat');
select throws_ok($$ select public.redeem_invite((select token from t)) $$, 'P0001', null, 'expired fails');

select * from finish();
rollback;
