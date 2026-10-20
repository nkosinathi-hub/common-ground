-- One Simkl account per user, linked through the simkl Edge Function (docs/runbooks/simkl.md).
-- The access token is written and read only by that function's service role: clients may read
-- the other columns of their own row and delete it (disconnect), never touch the token.
create table public.simkl_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  access_token text not null check (char_length(access_token) between 1 and 512),
  cursor timestamptz,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

alter table public.simkl_links enable row level security;

create policy simkl_links_select_own on public.simkl_links for select to authenticated
  using (user_id = (select auth.uid()));
create policy simkl_links_delete_own on public.simkl_links for delete to authenticated
  using (user_id = (select auth.uid()));

grant select (user_id, cursor, connected_at, last_synced_at) on public.simkl_links
  to authenticated;
grant delete on public.simkl_links to authenticated;
grant select, insert, update, delete on public.simkl_links to service_role;
