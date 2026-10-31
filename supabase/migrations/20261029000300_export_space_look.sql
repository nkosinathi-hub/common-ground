-- v0.6 (#75): the exported space object adds the look and the background picture path.
-- Redefines export_space (20261016400300).
create or replace function public.export_space(target_space uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  tables jsonb := '{}'::jsonb;
  tbl text;
  rows jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.is_space_member(target_space) then
    raise exception 'only members can export this space' using errcode = '42501';
  end if;
  foreach tbl in array public.export_table_names() loop
    rows := public.export_table_rows(tbl, target_space);
    if rows is not null then tables := tables || jsonb_build_object(tbl, rows); end if;
  end loop;
  return jsonb_build_object(
    'space', (select jsonb_build_object('id', s.id, 'name', s.name, 'template', s.template,
        'created_at', s.created_at, 'tagline', s.tagline, 'description', s.description,
        'theme', s.theme, 'accent_color', s.accent_color, 'look', s.look, 'icon', s.icon,
        'avatar_path', s.avatar_path, 'cover_path', s.cover_path,
        'background_path', s.background_path, 'home_cards', s.home_cards,
        'default_watch_intent', s.default_watch_intent, 'week_starts_on', s.week_starts_on)
      from public.spaces s where s.id = target_space),
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', m.user_id,
        'display_name', p.display_name, 'role', m.role, 'joined_at', m.joined_at)
        order by m.joined_at), '[]'::jsonb)
      from public.space_members m join public.profiles p on p.id = m.user_id
      where m.space_id = target_space),
    'exported_at', now(),
    'tables', tables
  );
end;
$$;

revoke all on function public.export_space(uuid) from public, anon, authenticated;
grant execute on function public.export_space(uuid) to authenticated;
