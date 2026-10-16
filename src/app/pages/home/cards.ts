import type { HomeCardId } from "@/shared/domain"

/** Cards HomeCard.svelte can render today; features add theirs here as they land. */
export const RENDERABLE_CARDS: ReadonlySet<HomeCardId> = new Set([
  "notes",
  "continue_watching",
  "coming_up",
  "calendar",
  "recommended",
  "activity",
])
