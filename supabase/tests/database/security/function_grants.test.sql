-- Deny by default for functions: anon executes nothing, and authenticated executes exactly the
-- client RPCs and the helpers that policies and checks call. A new function missing from the
-- allow-list below fails this test until it is either revoked or deliberately listed.
begin;
select plan(4);

select is(
  (select array_agg(p.proname order by p.proname)::text from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
  null, 'anon can execute no public function');

select is(
  (select array_agg(p.proname order by p.proname)::text from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
      and p.prorettype = 'trigger'::regtype),
  null, 'no trigger function is client-callable');

select is(
  (select array_agg(p.proname::text order by p.proname) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')),
  (select array_agg(f order by f) from unnest(array[
    -- client RPCs
    'add_catalog_title', 'by_me', 'change_idea_currency', 'create_invite', 'create_space',
    'delete_attachment', 'delete_comment', 'delete_my_account', 'delete_space', 'edit_comment',
    'export_me', 'export_space', 'invite_idea_collaborator', 'invite_preview', 'leave_space',
    'list_calendar', 'list_watch_items', 'log_watch_session', 'mark_note_read', 'ours',
    'post_comment', 'post_note', 'recommend', 'redeem_invite', 'register_push_device',
    'remove_idea_collaborator',
    'remove_member', 'reply_to_note', 'respond_idea_invite', 'respond_recommendation',
    'respond_to_note', 'revoke_invite', 'rsvp_event', 'save_watch_progress', 'send_note_draft',
    'set_event_attendees', 'set_my_event_reminders', 'set_space_media', 'transfer_ownership',
    'unregister_push_device', 'update_idea_brief',
    'start_party', 'join_party', 'confirm_party', 'finish_party', 'cancel_party', 'handover_party',
    -- called by policies, checks, triggers running as the caller, or invoker RPCs
    'can_read_attachment_object', 'is_iana_time_zone', 'is_member_of', 'is_space_member',
    'is_space_owner', 'is_valid_home_cards', 'is_valid_idea_brief', 'is_valid_note_sections',
    'shares_space_with', 'space_media_quota_ok', 'space_media_space', 'is_party_topic_member'
  ]) f),
  'authenticated executes exactly the allow-listed functions');

select is(
  (select array_agg(p.proname order by p.proname)::text from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%'),
  null, 'every public function pins its search_path');

select * from finish();
rollback;
