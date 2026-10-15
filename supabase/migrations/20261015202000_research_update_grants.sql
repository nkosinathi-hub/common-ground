-- Notes and research links are never edited, and a hypothesis only changes status
-- (src/features/ideas/infrastructure/supabase-research.ts). Grant no more than that.
-- Revoking the table privilege also revokes every column privilege granted before.
revoke update on public.idea_notes, public.research_links, public.hypotheses from authenticated;
grant update (status) on public.hypotheses to authenticated;
