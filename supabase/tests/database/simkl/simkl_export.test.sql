-- The personal export carries the caller's Simkl link, never its access token.
begin;
select plan(5);

select tests.create_user('skx_ana');
select tests.create_user('skx_ben');
insert into public.simkl_links (user_id, access_token, cursor)
  values (tests.user_id('skx_ana'), 'secret-token-ana', '2026-03-01T00:00:00Z');

select tests.act_as('skx_ana');
select ok(public.export_me() -> 'simkl' ? 'connected_at', 'the link is exported');
select is((public.export_me() #>> '{simkl,cursor}')::timestamptz,
  '2026-03-01T00:00:00Z'::timestamptz, 'with its cursor');
select ok(not (public.export_me() -> 'simkl' ? 'access_token'), 'the token is not exported');
select ok(public.export_me()::text not like '%secret-token-ana%', 'nowhere in the export');

select tests.act_as('skx_ben');
select is(public.export_me() -> 'simkl', 'null'::jsonb, 'no link exports as null');

select * from finish();
rollback;
