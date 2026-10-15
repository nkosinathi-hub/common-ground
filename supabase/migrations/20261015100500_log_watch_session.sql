-- Logs a watched-together session and marks each present member completed on that date.
-- Absent members are untouched; present members keep their season, episode and rating.
create or replace function public.log_watch_session(
  item uuid, watched_on date, member_ids uuid[], note text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target_space uuid;
  present uuid[];
  new_id uuid;
begin
  if caller is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select w.space_id into target_space from public.watch_items w where w.id = item;
  if target_space is null or not public.is_space_member(target_space) then
    raise exception 'That title is no longer on your list' using errcode = 'P0002';
  end if;
  select coalesce(array_agg(distinct m), '{}') into present from unnest(member_ids) m
    where m is not null;
  if cardinality(present) = 0 then
    raise exception 'Choose who was there' using errcode = 'P0001';
  end if;
  if exists (select 1 from unnest(present) m where not public.is_member_of(target_space, m)) then
    raise exception 'Everyone present must be a member of this space' using errcode = 'P0001';
  end if;
  if watched_on is null or watched_on > current_date + 1 then
    raise exception 'Choose the day you watched it' using errcode = 'P0001';
  end if;

  insert into public.watch_sessions (space_id, watch_item_id, watched_on, note, created_by)
    values (target_space, item, watched_on, nullif(btrim(note), ''), caller)
    returning id into new_id;
  insert into public.watch_session_members (session_id, space_id, user_id)
    select new_id, target_space, m from unnest(present) m;
  insert into public.watch_progress (watch_item_id, space_id, user_id, status, completed_on)
    select item, target_space, m, 'completed', watched_on from unnest(present) m
  on conflict (watch_item_id, user_id) do update
    set status = 'completed', completed_on = excluded.completed_on;
  perform public.record_activity(target_space, 'watched_together', 'watch_item', item);
  return new_id;
end;
$$;

grant execute on function public.log_watch_session(uuid, date, uuid[], text) to authenticated;
