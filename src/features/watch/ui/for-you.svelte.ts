import { ok } from "@/shared/domain"
import { Resource } from "@/shared/ui"
import type { ForYouScore } from "../domain/for-you"
import { useWatch } from "./context"

/** Your For you scores in a space; call while a component starts. Without opinions, none. */
export function useForYou(spaceId: () => string) {
  const { opinions } = useWatch()
  const scores = new Resource(async () =>
    opinions ? opinions.forYou(spaceId()) : ok<ForYouScore[]>([]),
  )
  const byItem: Record<string, ForYouScore> = $derived(
    Object.fromEntries((scores.value ?? []).map((s) => [s.itemId, s])),
  )
  return {
    scores,
    /** Higher first; a disliked title ranks below everything. */
    rank: (itemId: string) => {
      const s = byItem[itemId]
      return s ? (s.opinion === "disliked" ? -100 : s.score) : 0
    },
    disliked: (itemId: string) => byItem[itemId]?.opinion === "disliked",
  }
}
