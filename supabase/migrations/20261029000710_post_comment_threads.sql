-- v0.6 (#77): post_comment takes a reply target and an episode tag. A title comment with no
-- tag takes the author's place; a reply shares its comment's. Redefines 20261015300300.
drop function if exists public.post_comment(uuid, text, uuid, text, boolean, uuid[]);
drop function if exists public.post_comment(uuid, text, uuid, text, boolean, uuid[], uuid, integer,
  integer);
create or replace function public.post_comment(
  target_space uuid, parent_kind text, parent_id uuid,
  body text, spoiler boolean, mention_ids uuid[],
  in_reply_to uuid default null, tag_season integer default null, tag_episode integer default null
) returns public.comments
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.comments;
  root public.comments;
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
  if in_reply_to is not null then
    -- One level: a reply to a reply joins the thread of the comment it answers.
    select * into root from public.comments c where c.id = in_reply_to;
    if root.reply_to is not null then
      select * into root from public.comments c where c.id = root.reply_to;
    end if;
    if root.id is null or root.space_id <> target_space
      or coalesce(root.watch_item_id, root.idea_id) <> parent_id then
      raise exception 'A reply stays in its comment''s thread' using errcode = 'P0001';
    end if;
    tag_season := root.season;
    tag_episode := root.episode;
  elsif parent_kind = 'watch' and tag_season is null then
    select p.season, p.episode into tag_season, tag_episode from public.watch_progress p
    where p.watch_item_id = parent_id and p.user_id = (select auth.uid());
  end if;
  if parent_kind = 'idea' or tag_episode is null then
    tag_season := null;
    tag_episode := null;
  end if;
  insert into public.comments (space_id, watch_item_id, idea_id, body, spoiler, reply_to, season,
    episode)
  values (
    target_space,
    case when parent_kind = 'watch' then parent_id end,
    case when parent_kind = 'idea' then parent_id end,
    btrim(body),
    coalesce(spoiler, false),
    root.id,
    tag_season,
    tag_episode
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
revoke execute on function public.post_comment(uuid, text, uuid, text, boolean, uuid[], uuid,
  integer, integer) from public, anon;
grant execute on function public.post_comment(uuid, text, uuid, text, boolean, uuid[], uuid,
  integer, integer) to authenticated;
