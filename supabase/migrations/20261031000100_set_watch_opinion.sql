-- v0.6.1: liking failed with "You do not have access to that". The app saved by upsert, which also
-- rewrites space_id and watch_item_id, and only opinion may be updated. This function is the one
-- way to like, dislike or clear: it finds the title's space itself and updates only the opinion.
create or replace function public.set_watch_opinion(
  target_item uuid, choice public.watch_opinion default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare item_space uuid;
begin
  select space_id into item_space from public.watch_items where id = target_item;
  if item_space is null or not public.is_space_member(item_space) then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  if choice is null then
    delete from public.watch_opinions
      where user_id = (select auth.uid()) and watch_item_id = target_item;
    return;
  end if;
  insert into public.watch_opinions (space_id, watch_item_id, opinion)
    values (item_space, target_item, choice)
    on conflict (user_id, watch_item_id) do update set opinion = excluded.opinion;
end;
$$;

revoke all on function public.set_watch_opinion(uuid, public.watch_opinion) from public, anon;
grant execute on function public.set_watch_opinion(uuid, public.watch_opinion) to authenticated;
