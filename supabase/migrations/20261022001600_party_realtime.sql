-- Private Realtime for parties: on topic 'party:<id>', only members of that open party receive
-- (select) and send (insert), separately for broadcast and presence. Every other private topic
-- is refused. The project's Realtime setting "Allow public access" must be off (docs/parties.md),
-- or a client could skip these policies with a public channel.

-- Called by the policies as the caller; reads parties as definer so the check is one lookup.
create or replace function public.is_party_topic_member(topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if topic is null or topic !~ '^party:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    return false;
  end if;
  return exists (
    select 1 from public.watch_parties p
    join public.watch_party_members m on m.party_id = p.id and m.user_id = (select auth.uid())
    where p.id = substr(topic, 7)::uuid and p.status in ('planned', 'live')
      and public.is_space_member(p.space_id));
end;
$$;

revoke execute on function public.is_party_topic_member(text) from public, anon;
grant execute on function public.is_party_topic_member(text) to authenticated;

create policy party_broadcast_receive on realtime.messages for select to authenticated
  using (realtime.messages.extension = 'broadcast'
    and public.is_party_topic_member((select realtime.topic())));
create policy party_broadcast_send on realtime.messages for insert to authenticated
  with check (realtime.messages.extension = 'broadcast'
    and public.is_party_topic_member((select realtime.topic())));
create policy party_presence_receive on realtime.messages for select to authenticated
  using (realtime.messages.extension = 'presence'
    and public.is_party_topic_member((select realtime.topic())));
create policy party_presence_send on realtime.messages for insert to authenticated
  with check (realtime.messages.extension = 'presence'
    and public.is_party_topic_member((select realtime.topic())));
