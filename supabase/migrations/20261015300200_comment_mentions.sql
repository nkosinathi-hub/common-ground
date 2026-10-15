-- Mentions are chosen explicitly and stored as user ids; the comment text is never parsed.
create table public.comment_mentions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (comment_id, user_id)
);
create index comment_mentions_user on public.comment_mentions (user_id);

-- A mentioned user must be a current member of the comment's space.
create or replace function public.check_comment_mention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.comments c
    where c.id = new.comment_id and public.is_member_of(c.space_id, new.user_id)
  ) then
    raise exception 'You can only mention members of this space' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.check_comment_mention() from public, authenticated;

create trigger comment_mentions_member before insert or update on public.comment_mentions
  for each row execute function public.check_comment_mention();

alter table public.comment_mentions enable row level security;

-- Visible exactly when the comment is (the subquery runs under the comments policy).
create policy comment_mentions_select on public.comment_mentions for select to authenticated
  using (exists (select 1 from public.comments c where c.id = comment_id));

grant select on public.comment_mentions to authenticated;
