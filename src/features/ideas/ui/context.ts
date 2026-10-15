import { getContext, setContext } from "svelte"
import type { IdeasService } from "../application/ideas-service"
import type { ResearchService } from "../application/research-service"

const IDEAS = Symbol("ideas")
const RESEARCH = Symbol("idea-research")

/** The context entries the providers set; component tests pass them to render(). */
export const ideasContext = (ideas: IdeasService, research?: ResearchService) =>
  new Map<symbol, unknown>([
    [IDEAS, ideas],
    [RESEARCH, research],
  ])

/** Called by src/app/composition/ideas.ts with services bound to real adapters. */
export function provideIdeas(service: IdeasService): void {
  setContext(IDEAS, service)
}

export function provideResearch(service: ResearchService): void {
  setContext(RESEARCH, service)
}

export function useIdeas(): IdeasService {
  const service = getContext<IdeasService | undefined>(IDEAS)
  if (!service) throw new Error("Ideas are not provided: call provideIdeas in the composition root")
  return service
}

export function useResearch(): ResearchService {
  const service = getContext<ResearchService | undefined>(RESEARCH)
  if (!service)
    throw new Error("Research is not provided: call provideResearch in the composition root")
  return service
}
