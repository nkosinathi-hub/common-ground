import { ANA, SPACE, demoId, now } from "./identity"
import { CLUB_TITLES } from "./club-titles"
import { COUPLE_TITLES, type Place } from "./watch-titles"

const TITLES = [...COUPLE_TITLES, ...CLUB_TITLES]

/** Canonical genres, as the catalog Edge Function would store them, so For you has a reason. */
const GENRES: Record<string, string[]> = {
  "Ted Lasso": ["comedy", "drama"],
  "The Bear": ["comedy", "drama"],
  Severance: ["drama", "mystery", "scifi"],
  Shōgun: ["drama", "history", "war"],
  Arrival: ["drama", "mystery", "scifi"],
  Andor: ["action", "adventure", "scifi"],
  Chernobyl: ["drama", "history"],
  "The Last of Us": ["action", "adventure", "drama"],
}

const status = (places: readonly Place[] | undefined, user: string) =>
  places?.some(([who]) => who === user) ? "watching" : "not_started"

export const watchRows = TITLES.map(({ space, places = [], together, ...title }, i) => ({
  ...title,
  id: demoId(10 + i),
  space_id: space ?? SPACE,
  catalog_type: title.media_type === "movie" ? "movie" : "tv",
  shared_intent: "watch_together",
  manual_availability_note: "Saved for our next evening together",
  created_by: ANA,
  created_at: now,
  my_progress: status(places, ANA),
  sort_key: now,
  genres: GENRES[title.title] ?? [],
  streamable: true,
  together: together ?? null,
  places: places.map(([user_id, season, episode]) => ({
    user_id,
    status: "watching",
    season,
    episode,
  })),
}))

export const progressRows = watchRows.flatMap((item) =>
  item.places.map((place) => ({
    ...place,
    watch_item_id: item.id,
    space_id: item.space_id,
    completed_on: null,
    updated_at: now,
  })),
)
