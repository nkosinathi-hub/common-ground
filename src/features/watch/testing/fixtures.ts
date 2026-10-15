import type { WatchItem } from "../domain/types"

export const SPACE_ID = "5d1c3e7a-2b4f-4c6d-8e9f-0a1b2c3d4e5f"
export const ME = "me-user"
export const PARTNER = "partner-user"

const pad = (n: number) => String(n).padStart(12, "0")

/** A watch item whose id and createdAt grow with n, so newer items have larger n. */
export const item = (n: number, title: string, extra: Partial<WatchItem> = {}): WatchItem => ({
  id: `00000000-0000-4000-8000-${pad(n)}`,
  spaceId: SPACE_ID,
  catalog: null,
  title,
  mediaType: "movie",
  releaseYear: 2021,
  synopsis: `${title} synopsis`,
  posterPath: null,
  intent: "want_to_watch",
  availabilityNote: null,
  createdBy: ME,
  createdAt: new Date(Date.UTC(2026, 9, 1, 0, 0, n)).toISOString(),
  myStatus: "not_started",
  ...extra,
})
