-- The caller's own data: profile, sign-in email, memberships and how many rows they authored.
-- Features name their author column differently; the first one present is counted.
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
  col text;
  n bigint;
begin
  if caller is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  foreach tbl in array public.export_table_names() loop
    if to_regclass('public.' || tbl) is null then continue; end if;
    select c into col from unnest(array['created_by', 'author_id', 'sender_id', 'uploader_id']) c
    where public.has_column(tbl, c) limit 1;
    if col is null then continue; end if;
    execute format('select count(*) from public.%I where %I = $1', tbl, col) using caller into n;
    counts := counts || jsonb_build_object(tbl, n);
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
