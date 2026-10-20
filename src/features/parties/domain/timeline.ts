import { SYNC } from "./sync-constants"

/**
 * Where the shared playback is: `position` seconds into the title at shared time `at` (ms), and
 * moving in real time from then if playing. A play `at` in the future is a scheduled start.
 */
export interface Timeline {
  readonly playing: boolean
  readonly position: number
  readonly at: number
}

export const pausedAt = (position: number, at: number): Timeline => ({
  playing: false,
  position,
  at,
})
export const playingFrom = (position: number, at: number): Timeline => ({
  playing: true,
  position,
  at,
})

/** The shared position at shared time `now`; a scheduled start holds until it is due. */
export function positionAt(timeline: Timeline, now: number): number {
  if (!timeline.playing || now <= timeline.at) return timeline.position
  return timeline.position + (now - timeline.at) / 1000
}

/** Milliseconds until a scheduled start (0 once due), or null when paused. */
export const startsIn = (timeline: Timeline, now: number): number | null =>
  timeline.playing ? Math.max(0, timeline.at - now) : null

/** A play from `position` far enough ahead that a member a round trip away still gets it. */
export const scheduledStart = (position: number, now: number, rttMs: number): Timeline =>
  playingFrom(position, now + Math.max(SYNC.scheduleLeadMs, rttMs))
