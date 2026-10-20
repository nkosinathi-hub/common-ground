import type { Segment, SegmentKind } from "./source.types"

/** The share of a title that counts as watched. */
const WATCHED_SHARE = 0.9

export function hasWatchedEnough(positionSeconds: number, durationSeconds: number): boolean {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return false
  return positionSeconds >= durationSeconds * WATCHED_SHARE
}

export function activeSegment(segments: readonly Segment[], time: number): Segment | null {
  return segments.find((s) => time >= s.start && time < s.end) ?? null
}

export const SKIP_LABELS: Record<SegmentKind, string> = {
  intro: "Skip intro",
  credits: "Skip credits",
  recap: "Skip recap",
  preview: "Skip preview",
}
