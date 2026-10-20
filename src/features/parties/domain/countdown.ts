import { SYNC } from "./sync-constants"

/** When a co-watch countdown started at shared time `now` reaches go. */
export const countdownStart = (now: number): number =>
  now + SYNC.countdownS * 1000 + SYNC.scheduleLeadMs

/** The whole seconds left to show (3, 2, 1), then 0 for go. */
export const countdownAt = (startAt: number, now: number): number =>
  Math.min(SYNC.countdownS, Math.max(0, Math.ceil((startAt - now) / 1000)))
