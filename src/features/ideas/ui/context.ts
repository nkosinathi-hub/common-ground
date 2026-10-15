import { getContext, setContext } from "svelte"
import type { IdeasUseCases } from "../application/ideas-use-cases"
import type { ResearchUseCases } from "../application/research-use-cases"

const KEY = Symbol("ideas")
const RESEARCH = Symbol("idea-research")

/** Called by src/app/composition.ts with use cases bound to real adapters. */
export function provideIdeas(useCases: IdeasUseCases): void {
  setContext(KEY, useCases)
}

export function useIdeas(): IdeasUseCases {
  const useCases = getContext<IdeasUseCases | undefined>(KEY)
  if (!useCases) throw new Error("provideIdeas was not called above this component")
  return useCases
}

export function provideResearch(useCases: ResearchUseCases): void {
  setContext(RESEARCH, useCases)
}

export function useResearch(): ResearchUseCases {
  const useCases = getContext<ResearchUseCases | undefined>(RESEARCH)
  if (!useCases) throw new Error("provideResearch was not called above this component")
  return useCases
}
