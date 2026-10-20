/**
 * Party sync tuning, after Syncplay's defaults (docs/parties.md). Times in milliseconds unless the
 * name says seconds; rates are playback-rate offsets from 1.
 */
export const SYNC = {
  /** A shared play starts this far ahead, so every member receives it before it is due. */
  scheduleLeadMs: 300,
  /** Drift within this is left alone (and any nudge is undone). */
  driftToleranceS: 0.1,
  /** Up to this drift, a gentle playback-rate nudge closes the gap. */
  nudgeMaxDriftS: 2,
  /** Beyond this drift, seek straight to the shared position; between, nudge harder. */
  seekDriftS: 4,
  nudgeRate: 0.05,
  strongNudgeRate: 0.1,
  /** How often the host broadcasts the party state, and members check their drift. */
  stateIntervalMs: 1000,
  /** A host missing from presence this long is replaced by the earliest-joined member. */
  hostAbsentMs: 15_000,
  /** Clock samples kept per peer; the fastest half are trusted. */
  pingSamples: 8,
  /** The co-watch countdown, in seconds (3-2-1). */
  countdownS: 3,
} as const
