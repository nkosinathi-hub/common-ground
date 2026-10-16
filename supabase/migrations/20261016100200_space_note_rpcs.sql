-- Note writes. Each checks visibility itself (security definer bypasses the notes policies).
create or replace function public.post_note(
  target_space uuid, recipient uuid, body text, pinned boolean, expires_at timestamptz
) returns public.space_notes
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid()); created public.space_notes; m uuid;
begin
  if caller is null then raise exception 'sign in required' using errcode = '28000'; end if;
  if not public.is_space_member(target_space) then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(post_note.body, ''))) not between 1 and 1000 then
    raise exception 'Notes are 1 to 1000 characters' using errcode = 'P0001';
  end if;
  if recipient = caller or (recipient is not null and not public.is_member_of(target_space, recipient)) then
    raise exception 'Send a note to another member or to everyone' using errcode = 'P0001';
  end if;
  if post_note.expires_at <= now() or post_note.expires_at > now() + interval '90 days' then
    raise exception 'A note expires within 90 days' using errcode = 'P0001';
  end if;
  if (select count(*) from public.space_notes n where n.space_id = target_space
      and n.author_id = caller and n.created_at > now() - interval '24 hours') >= 30 then
    raise exception 'slow down: at most 30 notes a day' using errcode = 'P0001';
  end if;
  insert into public.space_notes (space_id, author_id, recipient_id, body, pinned, expires_at)
  values (target_space, caller, recipient, btrim(post_note.body), coalesce(post_note.pinned, false),
    post_note.expires_at)
  returning * into created;
  for m in select s.user_id from public.space_members s where s.space_id = target_space
      and (recipient is null or s.user_id = recipient) loop
    perform public.notify(m, target_space, 'note', 'space_note', created.id,
      'note:' || created.id || ':' || m);
  end loop;
  insert into public.space_note_reads (note_id, user_id) values (created.id, caller);
  return created;
end;
$$;

-- The note a caller may see, or P0002. Internal.
create or replace function public.visible_note(note uuid)
returns public.space_notes
language plpgsql
stable
security definer
set search_path = ''
as $$
declare found_note public.space_notes;
begin
  select * into found_note from public.space_notes n
  where n.id = note and public.is_space_member(n.space_id) and (n.recipient_id is null
    or n.recipient_id = (select auth.uid()) or n.author_id = (select auth.uid()));
  if found_note.id is null then raise exception 'note not found' using errcode = 'P0002'; end if;
  return found_note;
end;
$$;

create or replace function public.mark_note_read(note uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid());
begin
  perform public.visible_note(note);
  insert into public.space_note_reads (note_id, user_id) values (note, caller)
  on conflict (note_id, user_id) do update set read_at = now();
  update public.notifications set read_at = now()
  where recipient_id = caller and subject_type = 'space_note' and subject_id = note
    and read_at is null;
end;
$$;

revoke execute on function public.visible_note(uuid) from public, anon, authenticated;
grant execute on function public.post_note(uuid, uuid, text, boolean, timestamptz) to authenticated;
grant execute on function public.mark_note_read(uuid) to authenticated;
