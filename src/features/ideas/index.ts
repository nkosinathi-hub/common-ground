export * from "./domain"
export {
  makeIdeasUseCases,
  type IdeasUseCases,
  type SaveBriefOutcome,
} from "./application/ideas-use-cases"
export { makeResearchUseCases, type ResearchUseCases } from "./application/research-use-cases"
export type { IdeasRepository, ResearchRepository } from "./application/ports"
export { SupabaseIdeas } from "./infrastructure/supabase-ideas"
export { supabaseResearch } from "./infrastructure/supabase-research"
export { provideIdeas, provideResearch, useIdeas, useResearch } from "./ui/context"
export { default as IdeasPage } from "./ui/IdeasPage.svelte"
export { default as IdeaDetail } from "./ui/IdeaDetail.svelte"
export type { IdeaTab } from "./ui/IdeaTabs.svelte"
