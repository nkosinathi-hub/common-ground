begin;
select plan(12);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('cat');
select tests.create_user('eve');
select tests.act_as('ana');
select public.create_space('Us', 'couple');
create temp table t (token text);
grant all on t to authenticated;
insert into t select public.create_invite((select id from public.spaces limit 1));

select is((select count(*) from public.space_invites)::int, 1, 'owner sees the invite');
select is((select token_hash from public.space_invites limit 1), null, 'hash is not readable');

select tests.act_as('eve');
select is((select count(*) from public.space_invites)::int, 0, 'strangers cannot list invites');
select throws_ok($$ select public.create_invite((select space_id from public.space_members limit 1)) $$,
  null, null, 'non-owners cannot invite');

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
select public.remove_member((select id from public.spaces limit 1), tests.user_id('ben'));
update t set token = public.create_invite((select id from public.spaces limit 1));
select tests.act_as('ben');
select lives_ok($$ select public.redeem_invite((select token from t)) $$, 'removed member rejoins');

-- expired invites fail
select tests.reset_role();
update public.space_invites set expires_at = now() - interval '1 minute', redeemed_at = null, revoked_at = null;
select tests.act_as('cat');
select throws_ok($$ select public.redeem_invite((select token from t)) $$, 'P0001', null, 'expired fails');

select * from finish();
rollback;
