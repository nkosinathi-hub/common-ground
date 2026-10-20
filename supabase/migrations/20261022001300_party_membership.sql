-- Joining, confirming, cancelling and taking over an open party. The host confirming starts it.
-- handover_party lets a member take over when the host has gone: presence lives in Realtime, so
-- the server cannot see it, and the clients agree on who takes over (docs/parties.md).

-- Internal: the party, when it is still open (planned or live) for a member of its space.
create or replace function public.open_party(party uuid)
returns public.watch_parties
language plpgsql
stable
security definer
set search_path = ''
as $$
declare found public.watch_parties := public.party_for_member(party);
begin
  if found.status not in ('planned', 'live') then
    raise exception 'That watch party has already finished' using errcode = 'P0001';
  end if;
  return found;
end;
$$;

create or replace function public.join_party(party uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare found public.watch_parties := public.open_party(party);
begin
  insert into public.watch_party_members (party_id, space_id, user_id)
    values (found.id, found.space_id, (select auth.uid()))
  on conflict (party_id, user_id) do nothing;
end;
$$;

-- "I am in for these episodes": joins if needed. The host confirming makes the party live.
create or replace function public.confirm_party(party uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare found public.watch_parties := public.open_party(party);
begin
  insert into public.watch_party_members (party_id, space_id, user_id, confirmed)
    values (found.id, found.space_id, (select auth.uid()), true)
  on conflict (party_id, user_id) do update set confirmed = true;
  if found.host_id = (select auth.uid()) and found.status = 'planned' then
    update public.watch_parties set status = 'live', started_at = now() where id = found.id;
  end if;
end;
$$;

create or replace function public.cancel_party(party uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare found public.watch_parties := public.open_party(party);
begin
  if found.host_id is distinct from (select auth.uid()) then
    raise exception 'Only the host can cancel the party' using errcode = '42501';
  end if;
  update public.watch_parties set status = 'cancelled', ended_at = now() where id = found.id;
end;
$$;

create or replace function public.handover_party(party uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare found public.watch_parties := public.open_party(party);
begin
  if not exists (select 1 from public.watch_party_members m
    where m.party_id = found.id and m.user_id = (select auth.uid())) then
    raise exception 'Join the party first' using errcode = '42501';
  end if;
  if found.host_id = (select auth.uid()) then
    raise exception 'You are already the host' using errcode = 'P0001';
  end if;
  update public.watch_parties set host_id = (select auth.uid()) where id = found.id;
end;
$$;

revoke execute on function public.open_party(uuid) from public, anon, authenticated;
grant execute on function public.join_party(uuid) to authenticated;
grant execute on function public.confirm_party(uuid) to authenticated;
grant execute on function public.cancel_party(uuid) to authenticated;
grant execute on function public.handover_party(uuid) to authenticated;
