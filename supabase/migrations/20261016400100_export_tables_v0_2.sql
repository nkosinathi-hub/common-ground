-- Export allow-list for v0.2, and a privacy filter per table. export_space is security definer,
-- so RLS does not apply inside it: each filter repeats the table's select policy for the caller
-- ($1 the space, $2 the caller). A listed table without a filter makes the export fail, so a new
-- table can never be exported unfiltered. space_note_reads is never exported.
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
    'comments', 'comment_mentions', 'recommendations', 'attachments',
    'space_notes', 'space_note_replies', 'idea_collaborators',
    'calendar_events', 'calendar_event_attendees', 'calendar_event_reminders'
  ];
$$;

create or replace function public.export_table_filter(tbl text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  return case
    when tbl in ('ideas', 'idea_notes', 'research_links', 'hypotheses', 'milestones', 'tasks',
      'task_checklist_items', 'budget_entries', 'activity_events', 'watch_items', 'watch_progress',
      'watch_sessions', 'watch_session_members', 'comments', 'idea_collaborators',
      'calendar_events', 'calendar_event_attendees') then 't.space_id = $1'
    when tbl = 'comment_mentions' then
      't.comment_id in (select c.id from public.comments c where c.space_id = $1)'
    when tbl = 'recommendations' then 't.space_id = $1 and $2 in (t.sender_id, t.recipient_id)'
    when tbl = 'attachments' then 't.space_id = $1 and t.status::text = ''ready'''
    when tbl = 'space_notes' then
      't.space_id = $1 and (t.recipient_id is null or t.recipient_id = $2 or t.author_id = $2)'
    when tbl = 'space_note_replies' then 't.space_id = $1 and t.note_id in (select n.id from '
      || 'public.space_notes n where n.space_id = $1 and (n.recipient_id is null '
      || 'or n.recipient_id = $2 or n.author_id = $2))'
    when tbl = 'calendar_event_reminders' then 't.space_id = $1 and t.user_id = $2'
  end;
end;
$$;

revoke execute on function public.export_table_names() from public, anon, authenticated;
revoke execute on function public.export_table_filter(text) from public, anon, authenticated;
