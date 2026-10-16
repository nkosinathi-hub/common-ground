-- Write limits for comments and recommendations, which notify other members (mentions,
-- recommendations): the same count-in-a-window rule post_note uses, per author, on every insert.
create or replace function public.limit_comment_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.comments c
      where c.author_id = new.author_id and c.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'slow down: at most 60 comments an hour' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function public.limit_recommendation_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.recommendations r
      where r.sender_id = new.sender_id and r.created_at > now() - interval '24 hours') >= 30 then
    raise exception 'slow down: at most 30 recommendations a day' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger comments_rate_limit before insert on public.comments
  for each row when (new.author_id is not null) execute function public.limit_comment_rate();
create trigger recommendations_rate_limit before insert on public.recommendations
  for each row when (new.sender_id is not null)
  execute function public.limit_recommendation_rate();

revoke execute on function public.limit_comment_rate() from public, anon, authenticated;
revoke execute on function public.limit_recommendation_rate() from public, anon, authenticated;
