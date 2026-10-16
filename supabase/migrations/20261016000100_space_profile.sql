-- Space profile set by the owner: words, look, Home layout and defaults. Dark mode is per device.
create type public.space_theme as enum
  ('blank', 'couple', 'friends', 'family', 'ocean', 'meadow', 'dusk', 'berry');

-- Home cards in display order; a card that is absent is hidden.
create or replace function public.is_valid_home_cards(cards text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cards is not null and cardinality(cards) <= 8
    and cards <@ array['notes', 'continue_watching', 'coming_up', 'calendar', 'recommended',
      'activity', 'ideas']
    and cardinality(cards) = (select count(distinct c) from unnest(cards) c);
$$;

alter table public.spaces
  add column tagline text not null default ''
    constraint spaces_tagline_check check (char_length(tagline) <= 120
      and tagline = btrim(tagline) and tagline !~ '[[:cntrl:]]'),
  add column description text not null default ''
    constraint spaces_description_check check (char_length(description) <= 1000
      and description = btrim(description)),
  add column theme public.space_theme,
  add column accent_color text
    constraint spaces_accent_color_check check (accent_color ~ '^#[0-9a-f]{6}$'),
  add column icon text constraint spaces_icon_check check (icon ~ '^[a-z0-9-]{2,40}$'),
  add column avatar_path text,
  add column cover_path text,
  add column home_cards text[] not null
    default '{notes,continue_watching,coming_up,recommended,activity}'
    constraint spaces_home_cards_check check (public.is_valid_home_cards(home_cards)),
  add column default_watch_intent public.watch_intent not null default 'want_to_watch'
    constraint spaces_default_watch_intent_check check (default_watch_intent <> 'archived'),
  add column week_starts_on smallint not null default 1
    constraint spaces_week_starts_on_check check (week_starts_on in (0, 1)),
  add constraint spaces_avatar_path_check check (avatar_path ~ ('^' || id::text
    || '/avatar/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$')),
  add constraint spaces_cover_path_check check (cover_path ~ ('^' || id::text
    || '/cover/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'));

-- spaces_update_owner already limits updates to the owner. Media paths change only through
-- public.set_space_media, which checks the object exists.
revoke update on public.spaces from authenticated;
grant select, update (name, template, tagline, description, theme, accent_color, icon,
  home_cards, default_watch_intent, week_starts_on) on public.spaces to authenticated;
