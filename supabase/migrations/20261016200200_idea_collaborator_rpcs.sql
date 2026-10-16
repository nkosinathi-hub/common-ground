-- Inviting, answering and leaving. The author, an accepted collaborator or the owner invites.
create or replace function public.invite_idea_collaborator(idea uuid, member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target public.ideas; caller uuid := (select auth.uid());
begin
  select * into target from public.ideas i where i.id = idea and public.is_space_member(i.space_id);
  if target.id is null then raise exception 'idea not found' using errcode = 'P0002'; end if;
  if target.created_by is distinct from caller and not public.is_space_owner(target.space_id)
    and caller not in (select public.idea_participants(target.id)) then
    raise exception 'only people on this idea can invite' using errcode = '42501';
  end if;
  if member is null or not public.is_member_of(target.space_id, member)
    or member is not distinct from target.created_by then
    raise exception 'invite another member of this space' using errcode = 'P0001';
  end if;
  insert into public.idea_collaborators (space_id, idea_id, user_id, invited_by)
  values (target.space_id, target.id, member, caller)
  on conflict (idea_id, user_id) do nothing;
  if not found then return; end if;
  perform public.notify(member, target.space_id, 'idea_invite', 'idea', target.id,
    'idea_invite:' || target.id || ':' || member || ':' || current_date);
end;
$$;

create or replace function public.respond_idea_invite(idea uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare invite public.idea_collaborators; caller uuid := (select auth.uid());
begin
  select * into invite from public.idea_collaborators c
  where c.idea_id = idea and c.user_id = caller and c.accepted_at is null for update;
  if invite.idea_id is null then raise exception 'no pending invite' using errcode = 'P0002'; end if;
  if coalesce(accept, false) then
    update public.idea_collaborators set accepted_at = now()
    where idea_id = invite.idea_id and user_id = caller;
    perform public.notify(invite.invited_by, invite.space_id, 'idea_invite_accepted', 'idea',
      invite.idea_id, 'idea_invite_accepted:' || invite.idea_id || ':' || caller);
    perform public.record_activity(invite.space_id, 'idea_collaborator_joined', 'idea', invite.idea_id);
  else
    delete from public.idea_collaborators where idea_id = invite.idea_id and user_id = caller;
  end if;
end;
$$;

-- A collaborator leaves; the author or the owner removes anyone.
create or replace function public.remove_idea_collaborator(idea uuid, member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target public.ideas; caller uuid := (select auth.uid());
begin
  select * into target from public.ideas i where i.id = idea and public.is_space_member(i.space_id);
  if target.id is null then raise exception 'idea not found' using errcode = 'P0002'; end if;
  if member is distinct from caller and target.created_by is distinct from caller
    and not public.is_space_owner(target.space_id) then
    raise exception 'only the author or the owner can remove collaborators' using errcode = '42501';
  end if;
  delete from public.idea_collaborators where idea_id = target.id and user_id = member;
  if not found then raise exception 'not a collaborator' using errcode = 'P0002'; end if;
end;
$$;

grant execute on function public.invite_idea_collaborator(uuid, uuid) to authenticated;
grant execute on function public.respond_idea_invite(uuid, boolean) to authenticated;
grant execute on function public.remove_idea_collaborator(uuid, uuid) to authenticated;
