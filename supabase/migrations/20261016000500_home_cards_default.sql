-- New spaces show the v0.2 cards (notes, this week's calendar) by default, and spaces still on
-- the old default move to the new one; a space whose owner arranged Home keeps their layout.
alter table public.spaces
  alter column home_cards set default '{notes,calendar,continue_watching,coming_up,recommended,activity}';

update public.spaces
set home_cards = '{notes,calendar,continue_watching,coming_up,recommended,activity}'
where home_cards = '{notes,continue_watching,coming_up,recommended,activity}';
