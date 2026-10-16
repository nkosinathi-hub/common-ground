-- Attachments are exported with exactly the columns members may read (see
-- 20261015350400_attachments_column_grants): no storage path, declared type or upload state.
-- Otherwise as 20261016400200: rows of one allow-listed table, as the caller may see them.
create or replace function public.export_table_rows(tbl text, target_space uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  rows jsonb;
  scope text;
begin
  if tbl <> all (public.export_table_names()) or to_regclass('public.' || tbl) is null then
    return null;
  end if;
  scope := public.export_table_filter(tbl);
  if scope is null then
    raise exception 'no export filter for %', tbl using errcode = 'XX000';
  end if;
  execute format(
    'select coalesce(jsonb_agg(r order by r ->> ''created_at'', r ->> ''id''), ''[]''::jsonb)
     from (select to_jsonb(t) r from public.%I t where %s) s', tbl, scope)
    using target_space, (select auth.uid()) into rows;
  if tbl = 'attachments' then
    select coalesce(jsonb_agg((
      select jsonb_object_agg(f.key, f.value) from jsonb_each(a) f
      where f.key in ('id', 'idea_id', 'uploader_id', 'filename', 'verified_mime', 'bytes',
        'created_at')
    )), '[]'::jsonb) into rows from jsonb_array_elements(rows) a;
  end if;
  return rows;
end;
$$;

revoke execute on function public.export_table_rows(text, uuid) from public, anon, authenticated;
