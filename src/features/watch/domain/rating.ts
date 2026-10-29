import type { Progress, ProgressInput } from "./progress-types"
import { RATING_MAX } from "./validation"

/** The header's star rating: the saved progress with only the rating changed. */
export const withRating = (saved: Progress | null, rating: number | null): ProgressInput => ({
  status: saved?.status ?? "not_started",
  season: saved?.season ?? null,
  episode: saved?.episode ?? null,
  rating,
  completedOn: saved?.completedOn ?? null,
})

/** "Not rated" or "4 of 5", beside the stars and for screen readers. */
export const ratingLabel = (rating: number | null): string =>
  rating === null ? "Not rated" : `${rating} of ${RATING_MAX}`
