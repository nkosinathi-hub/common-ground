-- Drafts of "Something on my mind" notes, saved as the author types so they follow them across
-- devices. Only the author ever sees one; it notifies nobody. At most 5 per person per space.
create table public.space_note_drafts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null default auth.uid(),
  recipient_id uuid,
  sections jsonb not null default '{}' check (public.is_valid_note_sections(sections, true)),
  response_wish public.note_response_wish not null default 'any',
  support_wish public.note_support_wish,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint space_note_drafts_not_to_self check (recipient_id is distinct from author_id),
  -- Leaving the space takes the author's drafts with them; a recipient leaving keeps the draft.
  foreign key (space_id, author_id) references public.space_members (space_id, user_id)
    on delete cascade,
  foreign key (space_id, recipient_id) references public.space_members (space_id, user_id)
    on delete set null (recipient_id)
);
create index space_note_drafts_author on public.space_note_drafts (author_id, space_id);
create index space_note_drafts_recipient on public.space_note_drafts (space_id, recipient_id);

create trigger space_note_drafts_updated_at before update on public.space_note_drafts
  for each row execute function public.set_updated_at();

create or replace function public.space_note_drafts_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.space_id::text || new.author_id::text, 0));
  if (select count(*) from public.space_note_drafts d
      where d.space_id = new.space_id and d.author_id = new.author_id) >= 5 then
    raise exception 'You have 5 drafts already' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.space_note_drafts_limit() from public, anon, authenticated;

create trigger space_note_drafts_limit before insert on public.space_note_drafts
  for each row execute function public.space_note_drafts_limit();

alter table public.space_note_drafts enable row level security;

create policy space_note_drafts_own on public.space_note_drafts for all to authenticated
  using (author_id = (select auth.uid()) and public.is_space_member(space_id))
  with check (author_id = (select auth.uid()) and public.is_space_member(space_id));

revoke all on public.space_note_drafts from anon, authenticated;
grant select, delete on public.space_note_drafts to authenticated;
grant insert (space_id, recipient_id, sections, response_wish, support_wish),
  update (recipient_id, sections, response_wish, support_wish)
  on public.space_note_drafts to authenticated;
