-- Membership checks read current rows (never JWT claims). Security definer avoids recursive RLS.
create or replace function public.is_space_member(target_space uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members
    where space_id = target_space and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_space_owner(target_space uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members
    where space_id = target_space and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

create or replace function public.is_member_of(target_space uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members where space_id = target_space and user_id = target_user
  ) and (
    -- Not an oracle: only answers for spaces the caller belongs to (or server-side callers).
    (select auth.uid()) is null or public.is_space_member(target_space)
  );
$$;

create or replace function public.shares_space_with(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members mine
    join public.space_members theirs on theirs.space_id = mine.space_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other_user
  );
$$;

grant execute on function public.is_space_member(uuid) to authenticated;
grant execute on function public.is_space_owner(uuid) to authenticated;
grant execute on function public.is_member_of(uuid, uuid) to authenticated;
grant execute on function public.shares_space_with(uuid) to authenticated;
