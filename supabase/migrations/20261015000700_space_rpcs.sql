-- Multi-row space operations. Each validates the caller from auth.uid(), never from arguments.
create or replace function public.create_space(space_name text, space_template public.space_template)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid()); new_id uuid;
begin
  if caller is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if (select count(*) from public.space_members where user_id = caller and role = 'owner') >= 20 then
    raise exception 'space limit reached' using errcode = 'P0001';
  end if;
  insert into public.spaces (name, template, created_by) values (space_name, space_template, caller)
    returning id into new_id;
  insert into public.space_members (space_id, user_id, role) values (new_id, caller, 'owner');
  perform public.record_activity(new_id, 'space_created', 'space', new_id);
  return new_id;
end;
$$;

create or replace function public.leave_space(target_space uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_space_owner(target_space) then
    raise exception 'owner must transfer ownership or delete the space' using errcode = 'P0001';
  end if;
  delete from public.space_members where space_id = target_space and user_id = (select auth.uid());
  if not found then raise exception 'not a member' using errcode = '42501'; end if;
  perform public.after_member_left(target_space, (select auth.uid()));
end;
$$;

create or replace function public.remove_member(target_space uuid, member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only the owner can remove members' using errcode = '42501';
  end if;
  if member = (select auth.uid()) then
    raise exception 'owner cannot remove themselves' using errcode = 'P0001';
  end if;
  delete from public.space_members where space_id = target_space and user_id = member;
  if not found then raise exception 'not a member' using errcode = 'P0002'; end if;
  perform public.after_member_left(target_space, member);
end;
$$;

create or replace function public.transfer_ownership(target_space uuid, new_owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only the owner can transfer ownership' using errcode = '42501';
  end if;
  if not public.is_member_of(target_space, new_owner) or new_owner = (select auth.uid()) then
    raise exception 'new owner must be another member' using errcode = 'P0001';
  end if;
  update public.space_members set role = 'member'
    where space_id = target_space and user_id = (select auth.uid());
  update public.space_members set role = 'owner' where space_id = target_space and user_id = new_owner;
  perform public.notify(new_owner, target_space, 'ownership_received', 'space', target_space,
    'owner:' || target_space || ':' || now());
end;
$$;

create or replace function public.delete_space(target_space uuid, confirm_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only the owner can delete the space' using errcode = '42501';
  end if;
  if not exists (select 1 from public.spaces where id = target_space and name = confirm_name) then
    raise exception 'confirmation does not match the space name' using errcode = 'P0001';
  end if;
  delete from public.spaces where id = target_space;
end;
$$;
