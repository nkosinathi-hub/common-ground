-- Redemption needs a signed-in user. Status is only revealed to holders of the exact token.
create or replace function public.invite_preview(token text)
returns table (space_name text, inviter_name text, status text)
language plpgsql stable security definer set search_path = '' as $$
declare inv public.space_invites;
begin
  if (select auth.uid()) is null then raise exception 'sign in first' using errcode = '28000'; end if;
  select * into inv from public.space_invites where token_hash = public.hash_invite_token(token);
  if not found then return query select null::text, null::text, 'invalid'; return; end if;
  return query
    select s.name, p.display_name,
      case
        when public.is_member_of(inv.space_id, (select auth.uid())) then 'member'
        when inv.revoked_at is not null then 'revoked'
        when inv.redeemed_at is not null then 'used'
        when inv.expires_at <= now() then 'expired'
        else 'valid'
      end
    from public.spaces s left join public.profiles p on p.id = inv.created_by
    where s.id = inv.space_id;
end $$;

create or replace function public.redeem_invite(token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.space_invites; caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'sign in first' using errcode = '28000'; end if;
  select * into inv from public.space_invites
    where token_hash = public.hash_invite_token(token) for update;
  if not found or inv.revoked_at is not null or inv.redeemed_at is not null or inv.expires_at <= now() then
    raise exception 'this invitation is no longer valid' using errcode = 'P0001';
  end if;
  if public.is_member_of(inv.space_id, caller) then
    raise exception 'you are already a member of this space' using errcode = 'P0001';
  end if;
  insert into public.space_members (space_id, user_id, role) values (inv.space_id, caller, 'member');
  update public.space_invites set redeemed_by = caller, redeemed_at = now() where id = inv.id;
  perform public.record_activity(inv.space_id, 'member_joined', 'profile', caller);
  perform public.notify(m.user_id, inv.space_id, 'invite_accepted', 'profile', caller,
      'invite_accepted:' || inv.id)
    from public.space_members m where m.space_id = inv.space_id and m.role = 'owner';
  return inv.space_id;
end $$;

grant execute on function public.invite_preview(text) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
