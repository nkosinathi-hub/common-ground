-- v0.6 (#75): a space's whole look as one validated JSON value (D15b): colours, background and
-- sidebar style, density, corners, heading font and the background picture's focal point.
-- Keys are optional; an absent key means the design default. theme and accent_color stay for
-- older app builds and are no longer written; the look is mapped from them once below.
create or replace function public.is_valid_space_look(look jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(look) = 'object'
    and not exists (select 1 from jsonb_object_keys(look) k where k not in ('background', 'card',
      'button', 'backgroundStyle', 'sidebar', 'density', 'corners', 'headings', 'focusX', 'focusY'))
    and (not look ? 'background' or coalesce(look->>'background' ~ '^#[0-9a-f]{6}$', false))
    and (not look ? 'card' or coalesce(look->>'card' ~ '^#[0-9a-f]{6}$', false))
    and (not look ? 'button' or coalesce(look->>'button' ~ '^#[0-9a-f]{6}$', false))
    and (not look ? 'backgroundStyle'
      or coalesce(look->>'backgroundStyle' in ('solid', 'gradient', 'pattern', 'image'), false))
    and (not look ? 'sidebar' or coalesce(look->>'sidebar' in ('filled', 'light'), false))
    and (not look ? 'density'
      or coalesce(look->>'density' in ('compact', 'comfortable', 'spacious'), false))
    and (not look ? 'corners' or coalesce(look->>'corners' in ('square', 'soft', 'rounded'), false))
    and (not look ? 'headings' or coalesce(look->>'headings' in ('serif', 'sans'), false))
    and (not look ? 'focusX' or (jsonb_typeof(look->'focusX') = 'number'
      and (look->>'focusX')::numeric between 0 and 100))
    and (not look ? 'focusY' or (jsonb_typeof(look->'focusY') = 'number'
      and (look->>'focusY')::numeric between 0 and 100));
$$;

-- New functions default to EXECUTE for everyone; the check runs as the updating owner.
revoke execute on function public.is_valid_space_look(jsonb) from public, anon;
grant execute on function public.is_valid_space_look(jsonb) to authenticated;

alter table public.spaces
  add column if not exists look jsonb not null default '{}'::jsonb
    constraint spaces_look_check check (public.is_valid_space_look(look));

grant update (look) on public.spaces to authenticated;

-- A chosen preset or accent becomes the button colour; spaces that followed their template
-- keep the new default look.
update public.spaces set look = jsonb_build_object('button', coalesce(accent_color,
  case theme
    when 'blank' then '#526b4a' when 'couple' then '#8a4f5d' when 'friends' then '#62618c'
    when 'family' then '#806330' when 'ocean' then '#2f6a80' when 'meadow' then '#47682a'
    when 'dusk' then '#6a5285' when 'berry' then '#94405f'
  end))
where look = '{}'::jsonb and (accent_color is not null or theme is not null);
