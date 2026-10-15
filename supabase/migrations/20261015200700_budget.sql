-- Budget lines per idea in integer minor units of the idea's single currency.
create table public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  idea_id uuid not null,
  category text not null check (char_length(btrim(category)) between 1 and 80),
  label text not null check (char_length(btrim(label)) between 1 and 200),
  estimated_minor bigint not null default 0 check (estimated_minor >= 0),
  actual_minor bigint not null default 0 check (actual_minor >= 0),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade
);

create index budget_entries_page on public.budget_entries (idea_id, created_at desc, id desc);
create trigger budget_entries_updated_at before update on public.budget_entries
  for each row execute function public.set_updated_at();

alter table public.budget_entries enable row level security;
create policy budget_entries_member on public.budget_entries for all to authenticated
  using (public.is_space_member(space_id)) with check (public.is_space_member(space_id));

revoke all on public.budget_entries from anon, authenticated;
grant select, delete on public.budget_entries to authenticated;
grant insert (space_id, idea_id, category, label, estimated_minor, actual_minor),
  update (category, label, estimated_minor, actual_minor) on public.budget_entries to authenticated;

-- One currency per idea. Changing it would silently re-denominate existing amounts, so it is
-- refused while entries exist unless the caller explicitly asks to clear them.
create or replace function public.change_idea_currency(idea uuid, new_currency text, clear_entries boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target_space uuid;
begin
  select space_id into target_space from public.ideas where id = idea;
  if target_space is null or not public.is_space_member(target_space) then
    raise exception 'idea not found' using errcode = '42501';
  end if;
  if new_currency !~ '^[A-Z]{3}$' then
    raise exception 'use a three-letter ISO currency code' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.budget_entries where idea_id = idea) then
    if not clear_entries then
      raise exception 'clear the budget entries before changing currency' using errcode = 'P0001';
    end if;
    delete from public.budget_entries where idea_id = idea;
  end if;
  update public.ideas set currency = new_currency where id = idea;
end;
$$;

grant execute on function public.change_idea_currency(uuid, text, boolean) to authenticated;
