-- Indexes for the foreign keys a parent delete follows that had none (foreign_key_indexes.test.sql).
-- Deleting a space, a member's profile, or an idea, task or watch item linked from the calendar
-- otherwise scans the whole child table. Calendar links are optional, so those are partial.
create index notifications_space on public.notifications (space_id);
create index watch_session_members_user on public.watch_session_members (user_id);
create index space_note_nudges_user on public.space_note_nudges (user_id);
create index calendar_events_idea on public.calendar_events (idea_id) where idea_id is not null;
create index calendar_events_task on public.calendar_events (task_id) where task_id is not null;
create index calendar_events_watch_item on public.calendar_events (watch_item_id)
  where watch_item_id is not null;
