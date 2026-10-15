-- The caller's own data: profile, sign-in email, memberships and how many rows they authored.
create or replace function public.export_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  counts jsonb := '{}'::jsonb;
  tbl text;
  n bigint;
begin
  if caller is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  foreach tbl in array public.export_table_names() loop
    if to_regclass('public.' || tbl) is not null and public.has_column(tbl, 'created_by') then
      execute format('select count(*) from public.%I where created_by = $1', tbl)
        using caller into n;
      counts := counts || jsonb_build_object(tbl, n);
    end if;
  end loop;
  return jsonb_build_object(
    'profile', (select jsonb_build_object('id', p.id, 'display_name', p.display_name,
        'created_at', p.created_at) from public.profiles p where p.id = caller),
    'email', (select u.email from auth.users u where u.id = caller),
    'memberships', (select coalesce(jsonb_agg(jsonb_build_object('space_id', s.id,
        'name', s.name, 'role', m.role, 'joined_at', m.joined_at) order by m.joined_at),
        '[]'::jsonb)
      from public.space_members m join public.spaces s on s.id = m.space_id
      where m.user_id = caller),
    'counts', counts,
    'exported_at', now()
  );
end;
$$;

revoke all on function public.export_me() from public, anon, authenticated;
grant execute on function public.export_me() to authenticated;
