-- Deny by default for functions: anon executes nothing, internal helpers are server-only.
begin;
select plan(3);

select is(
  (select array_agg(p.proname order by p.proname)::text from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
  null, 'anon can execute no public function');

select is(
  (select array_agg(p.proname order by p.proname)::text from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
      and p.proname in ('handle_new_user', 'set_updated_at', 'watch_items_normalise', 'notify',
        'record_activity', 'after_member_left', 'consume_rate_limit', 'cleanup_candidates',
        'hash_invite_token', 'require_recent_sign_in')),
  null, 'triggers and internal helpers are not client-callable');

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%'),
  0, 'every security definer function pins its search_path');

select * from finish();
rollback;
