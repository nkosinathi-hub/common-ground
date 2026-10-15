-- Fixed-window request counters shared by every Edge Function worker. Service role only.
create table public.rate_limits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket text not null check (char_length(bucket) between 1 and 64),
  window_start timestamptz not null default now(),
  count integer not null default 0 check (count >= 0),
  primary key (user_id, bucket)
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.rate_limits to service_role;
