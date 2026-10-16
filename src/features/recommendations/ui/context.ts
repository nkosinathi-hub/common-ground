import { getContext, setContext } from "svelte"
import type { RecommendationsService } from "../application/recommendations-service"

const KEY = Symbol("recommendations")

export interface RecommendationsContext {
  readonly service: RecommendationsService
}

/** Called once by the composition root (src/app/composition). */
export function provideRecommendations(value: RecommendationsContext): void {
  setContext(KEY, value)
}

export function useRecommendations(): RecommendationsContext {
  const value = getContext<RecommendationsContext | undefined>(KEY)
  if (!value) throw new Error("Recommendations are not provided: call provideRecommendations")
  return value
}
