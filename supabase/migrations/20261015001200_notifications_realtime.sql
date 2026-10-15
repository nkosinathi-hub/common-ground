-- Recipients get live inserts; Realtime still applies the select policy per subscriber.
alter publication supabase_realtime add table public.notifications;
create index notifications_unread on public.notifications (recipient_id) where read_at is null;
