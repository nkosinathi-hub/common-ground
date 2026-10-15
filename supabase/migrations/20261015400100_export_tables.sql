-- Allow-list of space-scoped tables a member may export. Tables that do not exist yet are skipped
-- by the callers (to_regclass), so features can land in any order. Never list space_invites,
-- notifications, rate_limits or catalog_cache: they hold secrets, other people's inboxes or caches.
create or replace function public.export_table_names()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'ideas', 'idea_notes', 'research_links', 'hypotheses', 'milestones', 'tasks',
    'task_checklist_items', 'budget_entries', 'activity_events',
    'watch_items', 'watch_progress', 'watch_sessions', 'watch_session_members',
    'comments', 'comment_mentions', 'recommendations', 'attachments'
  ];
$$;

create or replace function public.has_column(tbl text, col text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = tbl and column_name = col
  );
$$;

-- Rows of one allow-listed table for one space. Attachments: finished uploads only, and only
-- descriptive columns, so storage secrets or signed URLs can never leave through an export.
create or replace function public.export_table_rows(tbl text, target_space uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  rows jsonb;
  scope text := 't.space_id = $1';
begin
  if tbl <> all (public.export_table_names()) or to_regclass('public.' || tbl) is null then
    return null;
  end if;
  if tbl = 'comment_mentions' then
    scope := 't.comment_id in (select c.id from public.comments c where c.space_id = $1)';
  elsif not public.has_column(tbl, 'space_id') then
    return null;
  end if;
  if tbl = 'attachments' then scope := scope || ' and t.status::text = ''ready'''; end if;
  execute format(
    'select coalesce(jsonb_agg(r order by r ->> ''created_at'', r ->> ''id''), ''[]''::jsonb)
     from (select to_jsonb(t) r from public.%I t where %s) s', tbl, scope)
    using target_space into rows;
  if tbl = 'attachments' then
    select coalesce(jsonb_agg((
      select jsonb_object_agg(f.key, f.value) from jsonb_each(a) f
      where f.key in ('id', 'filename', 'declared_mime', 'verified_mime', 'bytes', 'object_path')
    )), '[]'::jsonb) into rows from jsonb_array_elements(rows) a;
  end if;
  return rows;
end;
$$;

revoke execute on function public.export_table_names() from public, anon, authenticated;
revoke execute on function public.has_column(text, text) from public, anon, authenticated;
revoke execute on function public.export_table_rows(text, uuid) from public, anon, authenticated;
