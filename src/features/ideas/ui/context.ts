import { getContext, setContext } from "svelte"
import type { IdeasUseCases } from "../application/ideas-use-cases"

const KEY = Symbol("ideas")

/** Called by src/app/composition.ts with use cases bound to real adapters. */
export function provideIdeas(useCases: IdeasUseCases): void {
  setContext(KEY, useCases)
}

export function useIdeas(): IdeasUseCases {
  const useCases = getContext<IdeasUseCases | undefined>(KEY)
  if (!useCases) throw new Error("provideIdeas was not called above this component")
  return useCases
}
