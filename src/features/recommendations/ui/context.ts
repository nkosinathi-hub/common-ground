import { getContext, setContext } from "svelte"
import type { RecommendationsService } from "../application/recommendations-service"

/** Context key under which src/app/composition.ts provides the RecommendationsService. */
export const RECOMMENDATIONS_CONTEXT = Symbol("recommendations-service")

export const provideRecommendations = (service: RecommendationsService): RecommendationsService =>
  setContext(RECOMMENDATIONS_CONTEXT, service)

export function useRecommendations(): RecommendationsService {
  const service = getContext<RecommendationsService | undefined>(RECOMMENDATIONS_CONTEXT)
  if (!service)
    throw new Error("RecommendationsService is not provided: call provideRecommendations")
  return service
}
