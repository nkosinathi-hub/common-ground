-- Rows of one allow-listed table for one space, as the caller may see them (see
-- export_table_filter). Attachments keep only descriptive columns.
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
      where f.key in ('id', 'filename', 'declared_mime', 'verified_mime', 'bytes', 'object_path')
    )), '[]'::jsonb) into rows from jsonb_array_elements(rows) a;
  end if;
  return rows;
end;
$$;

revoke execute on function public.export_table_rows(text, uuid) from public, anon, authenticated;
