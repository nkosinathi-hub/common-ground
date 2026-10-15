-- Recommendation writes. Recipients must be current members other than the sender.
create or replace function public.recommend(item uuid, recipient_ids uuid[], note text)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_space uuid;
  recipient uuid;
  created uuid;
  ids uuid[] := '{}';
  clean_note text := nullif(btrim(coalesce(note, '')), '');
begin
  select w.space_id into target_space from public.watch_items w where w.id = item;
  if target_space is null or not public.is_space_member(target_space) then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  if coalesce(cardinality(recipient_ids), 0) = 0 then
    raise exception 'Choose at least one member' using errcode = 'P0001';
  end if;
  if char_length(clean_note) > 500 then
    raise exception 'Notes are at most 500 characters' using errcode = 'P0001';
  end if;
  for recipient in select distinct r from unnest(recipient_ids) as r loop
    if recipient = (select auth.uid()) or not public.is_member_of(target_space, recipient) then
      raise exception 'Recommend only to other members of this space' using errcode = 'P0001';
    end if;
    begin
      insert into public.recommendations (space_id, watch_item_id, recipient_id, note)
      values (target_space, item, recipient, clean_note)
      returning id into created;
    exception when unique_violation then
      raise exception 'That member already has this recommendation waiting'
        using errcode = 'P0001';
    end;
    perform public.notify(recipient, target_space, 'recommendation', 'watch_item', item,
      'rec:' || created);
    ids := ids || created;
  end loop;
  return ids;
end;
$$;

create or replace function public.respond_recommendation(target uuid, response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if response is null or response not in ('acknowledged', 'dismissed') then
    raise exception 'Respond with acknowledged or dismissed' using errcode = 'P0001';
  end if;
  update public.recommendations r
  set status = response, responded_at = now()
  where r.id = target
    and r.recipient_id = (select auth.uid())
    and r.status = 'pending'
    and public.is_space_member(r.space_id);
  if not found then
    raise exception 'Only the recipient can answer a waiting recommendation'
      using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.recommend(uuid, uuid[], text) to authenticated;
grant execute on function public.respond_recommendation(uuid, text) to authenticated;
