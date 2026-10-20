/** One ping to the reference peer and its pong, each time on the clock that took it. */
export interface PingSample {
  /** Local clock when the ping left. */
  readonly sentAt: number
  /** Peer clock when the ping arrived. */
  readonly peerReceivedAt: number
  /** Peer clock when the pong left. */
  readonly peerSentAt: number
  /** Local clock when the pong arrived. */
  readonly receivedAt: number
}

/** How far the reference clock runs ahead of the local one, and the round trip it was seen over. */
export interface ClockEstimate {
  readonly offsetMs: number
  readonly rttMs: number
}

/** NTP's offset and delay for one exchange; exact when both legs take as long. */
export function sampleOffset(s: PingSample): ClockEstimate {
  return {
    offsetMs: (s.peerReceivedAt - s.sentAt + (s.peerSentAt - s.receivedAt)) / 2,
    rttMs: s.receivedAt - s.sentAt - (s.peerSentAt - s.peerReceivedAt),
  }
}

/**
 * The median offset of the fastest half of the samples: a slow trip is usually a lopsided one,
 * so it says least about the offset. The round trip reported is the fastest seen.
 */
export function estimateOffset(samples: readonly PingSample[]): ClockEstimate | null {
  if (samples.length === 0) return null
  const fastest = samples
    .map(sampleOffset)
    .sort((a, b) => a.rttMs - b.rttMs)
    .slice(0, Math.ceil(samples.length / 2))
  const offsets = fastest.map((s) => s.offsetMs).sort((a, b) => a - b)
  const mid = offsets.length / 2
  const offsetMs = Number.isInteger(mid)
    ? (offsets[mid - 1]! + offsets[mid]!) / 2
    : offsets[Math.floor(mid)]!
  return { offsetMs, rttMs: fastest[0]!.rttMs }
}

/** The reference (party) clock now, from the local clock and the estimate so far. */
export const sharedNow = (localNow: number, estimate: ClockEstimate | null): number =>
  localNow + (estimate?.offsetMs ?? 0)
