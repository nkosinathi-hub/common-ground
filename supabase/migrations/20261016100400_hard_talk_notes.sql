-- "Something on my mind" notes: a direct note written in up to four optional parts, with how the
-- writer would like a response. It has no body, is never pinned or expiring, and is not edited.
create type public.note_kind as enum ('note', 'hard_talk');
create type public.note_response_wish as enum ('talk', 'write', 'read', 'any');
create type public.note_support_wish as enum ('listen', 'solve');
create type public.note_response_kind as enum ('here', 'time', 'talk', 'thanks');

-- Parts are keyed happened, feel, matters and help; each is text of at most 500 characters.
-- Unless allow_empty, at least one part has words. Check constraints call it as the caller.
create or replace function public.is_valid_note_sections(sections jsonb, allow_empty boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_typeof(sections) = 'object'
    and not exists (select 1 from jsonb_each(sections) e
      where e.key not in ('happened', 'feel', 'matters', 'help')
        or jsonb_typeof(e.value) <> 'string' or char_length(e.value #>> '{}') > 500)
    and (allow_empty or exists (select 1 from jsonb_each_text(sections) e
      where btrim(e.value) <> '')), false);
$$;

revoke execute on function public.is_valid_note_sections(jsonb, boolean) from public, anon;
grant execute on function public.is_valid_note_sections(jsonb, boolean) to authenticated;

alter table public.space_notes
  add column kind public.note_kind not null default 'note',
  add column sections jsonb,
  add column response_wish public.note_response_wish,
  add column support_wish public.note_support_wish,
  drop constraint space_notes_body_check,
  add constraint space_notes_kind_shape check (case kind
    when 'note' then char_length(btrim(body)) between 1 and 1000 and sections is null
      and response_wish is null and support_wish is null
    else body = '' and recipient_id is not null and not pinned and expires_at is null
      and response_wish is not null and public.is_valid_note_sections(sections, false)
  end);

-- Authors edit plain notes only: a "Something on my mind" note stays as it was sent.
drop policy space_notes_update on public.space_notes;
create policy space_notes_update on public.space_notes for update to authenticated
  using (author_id = (select auth.uid()) and kind = 'note' and public.is_space_member(space_id))
  with check (author_id = (select auth.uid()) and kind = 'note');
