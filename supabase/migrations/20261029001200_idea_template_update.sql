-- v0.6 (#78, D06 Template card): members may change an idea's template, which only decides which
-- overview fields lead. Same rule as renaming it. Grants are idempotent.
grant update (template) on public.ideas to authenticated;
