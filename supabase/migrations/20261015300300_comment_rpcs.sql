-- Comment writes. Authors edit their own; authors or the space owner delete (moderation).
create or replace function public.post_comment(
  target_space uuid, parent_kind text, parent_id uuid,
  body text, spoiler boolean, mention_ids uuid[]
) returns public.comments
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.comments;
  mentioned uuid;
begin
  if not public.is_space_member(target_space) then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  if parent_kind is null or parent_kind not in ('watch', 'idea') then
    raise exception 'Comments belong to a title or an idea' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(body, ''))) not between 1 and 4000 then
    raise exception 'Comments are 1 to 4000 characters' using errcode = 'P0001';
  end if;
  if cardinality(mention_ids) > 20 then
    raise exception 'Mention at most 20 people' using errcode = 'P0001';
  end if;
  insert into public.comments (space_id, watch_item_id, idea_id, body, spoiler)
  values (
    target_space,
    case when parent_kind = 'watch' then parent_id end,
    case when parent_kind = 'idea' then parent_id end,
    btrim(body),
    coalesce(spoiler, false)
  )
  returning * into created;
  for mentioned in select distinct m from unnest(coalesce(mention_ids, '{}')) as m loop
    insert into public.comment_mentions (comment_id, user_id) values (created.id, mentioned);
    -- The subject is the parent so the notification links to the thread itself.
    perform public.notify(mentioned, target_space, 'mention',
      case when parent_kind = 'watch' then 'watch_item' else 'idea' end, parent_id,
      'mention:' || created.id || ':' || mentioned);
  end loop;
  return created;
end;
$$;

create or replace function public.edit_comment(target uuid, new_body text, new_spoiler boolean)
returns public.comments
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed public.comments;
begin
  if char_length(btrim(coalesce(new_body, ''))) not between 1 and 4000 then
    raise exception 'Comments are 1 to 4000 characters' using errcode = 'P0001';
  end if;
  update public.comments c
  set body = btrim(new_body), spoiler = coalesce(new_spoiler, false), edited = true
  where c.id = target
    and c.author_id = (select auth.uid())
    and public.is_space_member(c.space_id)
  returning * into changed;
  if not found then
    raise exception 'You can only edit your own comments' using errcode = '42501';
  end if;
  return changed;
end;
$$;

create or replace function public.delete_comment(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.comments c
  where c.id = target
    and public.is_space_member(c.space_id)
    and (c.author_id = (select auth.uid()) or public.is_space_owner(c.space_id));
  if not found then
    raise exception 'You can only delete your own comments' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.post_comment(uuid, text, uuid, text, boolean, uuid[])
  to authenticated;
grant execute on function public.edit_comment(uuid, text, boolean) to authenticated;
grant execute on function public.delete_comment(uuid) to authenticated;
