-- Runs last for v0.2. Revoke again: Supabase default privileges still give anon and
-- authenticated EXECUTE on new functions. Internal helpers and trigger functions are
-- server-only; supabase/tests/database/security/function_grants.test.sql holds the allow-list.
revoke execute on all functions in schema public from public, anon;

revoke execute on function public.calendar_events_validate() from authenticated;
revoke execute on function public.calendar_events_add_creator() from authenticated;
revoke execute on function public.calendar_events_reschedule() from authenticated;
revoke execute on function public.calendar_events_notify_change() from authenticated;
revoke execute on function public.deliver_event_reminders() from authenticated;
revoke execute on function public.next_remind_at(uuid, integer, timestamptz) from authenticated;
revoke execute on function public.add_default_reminders(uuid, uuid) from authenticated;
revoke execute on function public.idea_participants(uuid) from authenticated;
revoke execute on function public.ideas_notify_comment() from authenticated;
revoke execute on function public.ideas_notify_stage() from authenticated;
revoke execute on function public.visible_note(uuid) from authenticated;
revoke execute on function public.export_table_filter(text) from authenticated;
revoke execute on function public.space_media_cleanup_candidates() from authenticated;
grant execute on function public.space_media_cleanup_candidates() to service_role;
