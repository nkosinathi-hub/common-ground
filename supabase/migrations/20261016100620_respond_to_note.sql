-- The recipient's gentle response to a "Something on my mind" note. It reads the note, tells the
-- author, and after "I need a little time" may set a private reminder in 1 or 3 days.
create or replace function public.respond_to_note(
  note uuid, kind public.note_response_kind, remind_in_days integer
) returns public.space_note_responses
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  root public.space_notes;
  created public.space_note_responses;
begin
  if caller is null then raise exception 'sign in required' using errcode = '28000'; end if;
  root := public.visible_note(note);
  if root.kind <> 'hard_talk' then
    raise exception 'Only a note shared this way takes a response' using errcode = 'P0001';
  end if;
  if root.recipient_id is distinct from caller then
    raise exception 'Only the person it was shared with can respond' using errcode = '42501';
  end if;
  if remind_in_days is not null and (respond_to_note.kind <> 'time'
      or remind_in_days not in (1, 3)) then
    raise exception 'A reminder is in 1 or 3 days' using errcode = '22023';
  end if;
  if (select count(*) from public.space_note_responses r where r.note_id = root.id) >= 20 then
    raise exception 'That is plenty of responses for one note' using errcode = 'P0001';
  end if;
  insert into public.space_note_responses (space_id, note_id, author_id, kind)
  values (root.space_id, root.id, caller, respond_to_note.kind)
  returning * into created;
  insert into public.space_note_reads (note_id, user_id) values (root.id, caller)
  on conflict (note_id, user_id) do update set read_at = now();
  update public.notifications set read_at = now()
  where recipient_id = caller and subject_type = 'space_note' and subject_id = root.id
    and read_at is null;
  perform public.notify(root.author_id, root.space_id, 'note_response', 'space_note', root.id,
    'note_response:' || created.id);
  if remind_in_days is not null then
    -- One reminder at a time per note: a newer request replaces an unsent one.
    delete from public.space_note_nudges x
    where x.note_id = root.id and x.user_id = caller and x.sent_at is null;
    insert into public.space_note_nudges (space_id, note_id, user_id, remind_at)
    values (root.space_id, root.id, caller, now() + make_interval(days => remind_in_days));
  end if;
  perform public.record_private_activity(root.space_id, 'hard_talk_response', 'space_note',
    root.id, root.author_id);
  return created;
end;
$$;

revoke execute on function public.respond_to_note(uuid, public.note_response_kind, integer)
  from public, anon;
grant execute on function public.respond_to_note(uuid, public.note_response_kind, integer)
  to authenticated;
