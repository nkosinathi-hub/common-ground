-- Simkl AUTH V2 (OAuth 2.0 device flow) on simkl_links (20261022000400). A row now starts as a
-- pending sign-in: the device code and its expiry, no tokens and no connected_at. Once Simkl
-- approves it the function stores the access token (7 days), the refresh token (180 days,
-- sliding) and the access expiry, and sets connected_at. None of the new columns is granted to
-- any client role: clients keep select on user_id, cursor, connected_at and last_synced_at only.
alter table public.simkl_links
  alter column access_token drop not null,
  alter column connected_at drop not null,
  alter column connected_at drop default,
  add column refresh_token text check (char_length(refresh_token) between 1 and 512),
  add column access_expires_at timestamptz,
  add column device_code text check (char_length(device_code) between 1 and 512),
  add column device_expires_at timestamptz,
  add column refresh_lease_until timestamptz;

-- Members see their link only once it is connected; a pending sign-in stays server-side.
drop policy simkl_links_select_own on public.simkl_links;
create policy simkl_links_select_own on public.simkl_links for select to authenticated
  using (user_id = (select auth.uid()) and connected_at is not null);

-- Only one refresh per user at a time: Simkl invalidates the previous access token on every
-- refresh, so two overlapping refreshes would cut each other off. The lease spans the HTTP
-- call, which a transaction lock through PostgREST cannot; it lapses after 30 seconds so a
-- crashed refresh never locks a user out. The function clears it when it saves the tokens.
create or replace function public.claim_simkl_refresh(target_user uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    update public.simkl_links l set refresh_lease_until = now() + interval '30 seconds'
    where l.user_id = target_user
      and (l.refresh_lease_until is null or l.refresh_lease_until < now())
    returning 1
  )
  select exists (select 1 from claimed);
$$;

revoke execute on function public.claim_simkl_refresh(uuid) from public, anon, authenticated;
grant execute on function public.claim_simkl_refresh(uuid) to service_role;
