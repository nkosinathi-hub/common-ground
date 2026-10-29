-- v0.6 (#76): "Something on your mind?" is its own Home card (D01). Redefines
-- is_valid_home_cards (20261016000100) and the home_cards default (20261016000500).
create or replace function public.is_valid_home_cards(cards text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cards is not null and cardinality(cards) <= 9
    and cards <@ array['notes', 'on_your_mind', 'continue_watching', 'coming_up', 'calendar',
      'recommended', 'activity', 'ideas']
    and cardinality(cards) = (select count(distinct c) from unnest(cards) c);
$$;

alter table public.spaces
  alter column home_cards
    set default '{notes,on_your_mind,calendar,continue_watching,coming_up,recommended,activity}';

-- Spaces that show Notes get the new card right after it; others keep their layout.
update public.spaces
set home_cards = array_cat(
  home_cards[1:array_position(home_cards, 'notes')],
  array_cat(array['on_your_mind'], home_cards[array_position(home_cards, 'notes') + 1:]))
where 'notes' = any(home_cards) and not 'on_your_mind' = any(home_cards);
