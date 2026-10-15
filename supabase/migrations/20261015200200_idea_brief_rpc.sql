-- Overview writes carry the updated_at the editor last saw; a stale value is a conflict (40001).
create or replace function public.update_idea_brief(
  idea uuid, expected_updated_at timestamptz, brief jsonb
) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare target_space uuid; saved timestamptz;
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select space_id into target_space from public.ideas where id = idea;
  if target_space is null or not public.is_space_member(target_space) then
    raise exception 'idea not found' using errcode = '42501';
  end if;
  update public.ideas set brief = update_idea_brief.brief
    where id = idea and updated_at = expected_updated_at
    returning updated_at into saved;
  if saved is null then
    raise exception 'conflict' using errcode = '40001', hint = 'reload the overview and merge';
  end if;
  return saved;
end;
$$;

grant execute on function public.update_idea_brief(uuid, timestamptz, jsonb) to authenticated;
