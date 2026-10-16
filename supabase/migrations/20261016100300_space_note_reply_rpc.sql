-- Replies notify the note author and, for a direct note, its recipient; for an everyone note,
-- up to 20 earlier repliers. Replying also marks the thread read for the replier.
create or replace function public.reply_to_note(note uuid, body text)
returns public.space_note_replies
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  root public.space_notes;
  created public.space_note_replies;
  m uuid;
begin
  if caller is null then raise exception 'sign in required' using errcode = '28000'; end if;
  root := public.visible_note(note);
  if char_length(btrim(coalesce(reply_to_note.body, ''))) not between 1 and 1000 then
    raise exception 'Replies are 1 to 1000 characters' using errcode = 'P0001';
  end if;
  if (select count(*) from public.space_note_replies r where r.note_id = root.id) >= 200 then
    raise exception 'This thread is full' using errcode = 'P0001';
  end if;
  insert into public.space_note_replies (space_id, note_id, author_id, body)
  values (root.space_id, root.id, caller, btrim(reply_to_note.body))
  returning * into created;
  for m in
    select root.author_id
    union select root.recipient_id where root.recipient_id is not null
    union (select r.author_id from public.space_note_replies r
      where root.recipient_id is null and r.note_id = root.id and r.id <> created.id
        and r.author_id is not null
      group by r.author_id order by max(r.created_at) desc limit 20)
  loop
    perform public.notify(m, root.space_id, 'note_reply', 'space_note', root.id,
      'note_reply:' || created.id || ':' || m);
  end loop;
  insert into public.space_note_reads (note_id, user_id) values (root.id, caller)
  on conflict (note_id, user_id) do update set read_at = now();
  return created;
end;
$$;

grant execute on function public.reply_to_note(uuid, text) to authenticated;
