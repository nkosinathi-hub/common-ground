export * from "./domain"
export {
  makeIdeasUseCases,
  type IdeasUseCases,
  type SaveBriefOutcome,
} from "./application/ideas-use-cases"
export type { IdeasRepository } from "./application/ports"
export { SupabaseIdeas } from "./infrastructure/supabase-ideas"
export { provideIdeas, useIdeas } from "./ui/context"
export { default as IdeasPage } from "./ui/IdeasPage.svelte"
export { default as IdeaDetail } from "./ui/IdeaDetail.svelte"
export type { IdeaTab } from "./ui/IdeaTabs.svelte"
