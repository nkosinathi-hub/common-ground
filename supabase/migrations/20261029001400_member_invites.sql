-- v0.6 Members & safety (D17, D17b): any member may invite. Everyone in the space sees the open
-- links and who made each; the owner may revoke any link, a member only their own.
drop policy if exists space_invites_owner_select on public.space_invites;
drop policy if exists space_invites_member_select on public.space_invites;
create policy space_invites_member_select on public.space_invites for select to authenticated
  using (public.is_space_member(space_id));

create or replace function public.create_invite(target_space uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare token text;
begin
  if not public.is_space_member(target_space) then
    raise exception 'only members can invite' using errcode = '42501';
  end if;
  if (select count(*) from public.space_invites where space_id = target_space
      and redeemed_at is null and revoked_at is null and expires_at > now()) >= 10 then
    raise exception 'too many open invitations; revoke one first' using errcode = 'P0001';
  end if;
  token := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  insert into public.space_invites (space_id, token_hash, created_by)
    values (target_space, public.hash_invite_token(token), (select auth.uid()));
  return token;
end $$;

create or replace function public.revoke_invite(invite uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.space_invites set revoked_at = now()
    where id = invite and redeemed_at is null and revoked_at is null
      and (public.is_space_owner(space_id)
        or (created_by = (select auth.uid()) and public.is_space_member(space_id)));
  if not found then raise exception 'invitation not found or not open' using errcode = 'P0002'; end if;
end $$;

grant execute on function public.create_invite(uuid) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
