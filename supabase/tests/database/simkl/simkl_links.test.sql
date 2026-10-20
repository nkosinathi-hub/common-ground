-- Simkl links: each user sees and removes only their own row, and no client ever reads or
-- writes the access token; only the simkl Edge Function's service role does.
begin;
select plan(13);

select tests.create_user('simkl_ana');
select tests.create_user('simkl_ben');
insert into public.simkl_links (user_id, access_token, connected_at)
  values (tests.user_id('simkl_ana'), 'token-ana', now()),
    (tests.user_id('simkl_ben'), 'token-ben', now());

select ok((select relrowsecurity from pg_class where oid = 'public.simkl_links'::regclass),
  'simkl_links has RLS enabled');
select ok(not has_column_privilege('authenticated', 'public.simkl_links', 'access_token',
  'select'), 'authenticated has no select on access_token');
select ok(not has_table_privilege('anon', 'public.simkl_links', 'select'),
  'anon reads nothing');

select tests.act_as('simkl_ana');
select is((select count(*)::int from public.simkl_links), 1, 'a user sees only her own row');
select is((select user_id from public.simkl_links), tests.user_id('simkl_ana'),
  'and it is hers');
select lives_ok($$ select user_id, cursor, connected_at, last_synced_at from public.simkl_links $$,
  'she reads the link columns');
select throws_ok($$ select access_token from public.simkl_links $$, '42501', null,
  'she cannot read the token');
select throws_ok($$ select * from public.simkl_links $$, '42501', null,
  'a star select is refused because of the token column');
select throws_ok($$ insert into public.simkl_links (user_id, access_token)
  values (tests.user_id('simkl_ana'), 'forged') $$, '42501', null, 'clients cannot insert');
select throws_ok($$ update public.simkl_links set access_token = 'forged' $$, '42501', null,
  'clients cannot write the token');

select lives_ok($$ delete from public.simkl_links where user_id = tests.user_id('simkl_ben') $$,
  'deleting someone else''s row runs');
select lives_ok($$ delete from public.simkl_links $$, 'she disconnects');
select tests.reset_role();
select is((select array_agg(access_token order by access_token) from public.simkl_links
  where user_id in (tests.user_id('simkl_ana'), tests.user_id('simkl_ben'))),
  array['token-ben'], 'only her own row went; his is untouched');

select * from finish();
rollback;
