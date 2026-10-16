-- Sends the caller's draft as a "Something on my mind" note in one transaction: blank parts are
-- left out, the recipient is told (never what it says), and the draft is gone. The activity entry
-- is private to the two of them.
create or replace function public.send_note_draft(draft uuid)
returns public.space_notes
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  d public.space_note_drafts;
  parts jsonb;
  created public.space_notes;
begin
  if caller is null then raise exception 'sign in required' using errcode = '28000'; end if;
  select * into d from public.space_note_drafts x where x.id = draft and x.author_id = caller
    for update;
  if d.id is null then raise exception 'draft not found' using errcode = 'P0002'; end if;
  if not public.is_space_member(d.space_id) then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  if d.recipient_id is null or d.recipient_id = caller
      or not public.is_member_of(d.space_id, d.recipient_id) then
    raise exception 'Choose who this is for' using errcode = 'P0001';
  end if;
  select coalesce(jsonb_object_agg(e.key, btrim(e.value)), '{}') into parts
  from jsonb_each_text(d.sections) e where btrim(e.value) <> '';
  if parts = '{}' then
    raise exception 'Write something in at least one part' using errcode = 'P0001';
  end if;
  if (select count(*) from public.space_notes n where n.space_id = d.space_id
      and n.author_id = caller and n.created_at > now() - interval '24 hours') >= 30 then
    raise exception 'slow down: at most 30 notes a day' using errcode = 'P0001';
  end if;
  insert into public.space_notes (space_id, author_id, recipient_id, body, kind, sections,
    response_wish, support_wish)
  values (d.space_id, caller, d.recipient_id, '', 'hard_talk', parts, d.response_wish,
    d.support_wish)
  returning * into created;
  perform public.notify(d.recipient_id, d.space_id, 'hard_talk', 'space_note', created.id,
    'hard_talk:' || created.id);
  insert into public.space_note_reads (note_id, user_id) values (created.id, caller);
  delete from public.space_note_drafts x where x.id = d.id;
  perform public.record_private_activity(d.space_id, 'hard_talk_shared', 'space_note',
    created.id, d.recipient_id);
  return created;
end;
$$;

revoke execute on function public.send_note_draft(uuid) from public, anon;
grant execute on function public.send_note_draft(uuid) to authenticated;
