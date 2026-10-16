import { getContext, setContext } from "svelte"
import type { IdeasService } from "../application/ideas-service"
import type { ResearchService } from "../application/research-service"

const IDEAS = Symbol("ideas")
const RESEARCH = Symbol("idea-research")

export interface IdeasContext {
  readonly service: IdeasService
}

export interface ResearchContext {
  readonly service: ResearchService
}

/** Called by src/app/composition/ideas.ts with services bound to real adapters. */
export function provideIdeas(value: IdeasContext): void {
  setContext(IDEAS, value)
}

export function provideResearch(value: ResearchContext): void {
  setContext(RESEARCH, value)
}

export function useIdeas(): IdeasContext {
  const value = getContext<IdeasContext | undefined>(IDEAS)
  if (!value) throw new Error("Ideas are not provided: call provideIdeas in the composition root")
  return value
}

export function useResearch(): ResearchContext {
  const value = getContext<ResearchContext | undefined>(RESEARCH)
  if (!value)
    throw new Error("Research is not provided: call provideResearch in the composition root")
  return value
}
