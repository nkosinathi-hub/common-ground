import { SYNC } from "./sync-constants"

/** What a member's player should do to stay with the party. */
export type Correction =
  { readonly kind: "rate"; readonly rate: number } | { readonly kind: "seek"; readonly to: number }

/**
 * Small drift is closed by playing slightly slower (ahead) or faster (behind), so nobody sees a
 * jump; a large drift seeks straight to the shared position. Positions are in seconds.
 */
export function correction(expected: number, actual: number): Correction {
  const drift = actual - expected
  const size = Math.abs(drift)
  if (size > SYNC.seekDriftS) return { kind: "seek", to: Math.max(0, expected) }
  if (size <= SYNC.driftToleranceS) return { kind: "rate", rate: 1 }
  const step = size <= SYNC.nudgeMaxDriftS ? SYNC.nudgeRate : SYNC.strongNudgeRate
  return { kind: "rate", rate: drift > 0 ? 1 - step : 1 + step }
}
