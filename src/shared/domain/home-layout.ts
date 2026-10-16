/** Cards a space's Home can show; must match public.is_valid_home_cards in the database. */
export const HOME_CARDS = [
  "notes",
  "continue_watching",
  "coming_up",
  "calendar",
  "recommended",
  "activity",
  "ideas",
] as const
export type HomeCardId = (typeof HOME_CARDS)[number]

/** The database default for spaces.home_cards: what a new space shows, in order. */
export const DEFAULT_HOME_CARDS: readonly HomeCardId[] = [
  "notes",
  "continue_watching",
  "coming_up",
  "recommended",
  "activity",
]

/** How each card is named in Home layout settings. */
export const HOME_CARD_LABELS: Record<HomeCardId, string> = {
  notes: "Notes for you",
  continue_watching: "Continue watching",
  coming_up: "Coming up",
  calendar: "This week",
  recommended: "Recommended for you",
  activity: "Recent activity",
  ideas: "Ideas in progress",
}

/** The owner's order, limited to cards this build can render, without repeats. */
export function visibleCards(
  cards: readonly string[] | undefined,
  available: ReadonlySet<HomeCardId>,
): HomeCardId[] {
  const chosen = cards ?? DEFAULT_HOME_CARDS
  const known = chosen.filter((id): id is HomeCardId => available.has(id as HomeCardId))
  return [...new Set(known)]
}

export function moveCard(cards: readonly HomeCardId[], id: HomeCardId, step: -1 | 1): HomeCardId[] {
  const from = cards.indexOf(id)
  const to = from + step
  if (from < 0 || to < 0 || to >= cards.length) return [...cards]
  const next = [...cards]
  ;[next[from], next[to]] = [next[to]!, next[from]!]
  return next
}

/** Hiding removes a card; showing it again puts it at the end, where the owner can move it. */
export const toggleCard = (cards: readonly HomeCardId[], id: HomeCardId): HomeCardId[] =>
  cards.includes(id) ? cards.filter((card) => card !== id) : [...cards, id]
