-- Single-use, seven-day invitation links. Only the SHA-256 of the token is stored.
create table public.space_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  redeemed_by uuid references public.profiles (id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz
);
create index space_invites_space on public.space_invites (space_id, created_at desc);

alter table public.space_invites enable row level security;
create policy space_invites_owner_select on public.space_invites for select to authenticated
  using (public.is_space_owner(space_id));
grant select (id, space_id, created_by, created_at, expires_at, redeemed_by, redeemed_at, revoked_at)
  on public.space_invites to authenticated;

create or replace function public.hash_invite_token(token text) returns bytea
language sql immutable set search_path = '' as $$
  select extensions.digest(convert_to(token, 'UTF8'), 'sha256')
$$;
revoke execute on function public.hash_invite_token(text) from public, authenticated;

create or replace function public.create_invite(target_space uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare token text;
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only the owner can invite' using errcode = '42501';
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
    where id = invite and public.is_space_owner(space_id) and redeemed_at is null and revoked_at is null;
  if not found then raise exception 'invitation not found or not open' using errcode = 'P0002'; end if;
end $$;

grant execute on function public.create_invite(uuid) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
