import { estimateOffset, sharedNow, type ClockEstimate, type PingSample } from "../domain/clock"
import type { PartyMessage } from "../domain/messages"
import { SYNC } from "../domain/sync-constants"
import type { Clock } from "./ports"

type Ping = Extract<PartyMessage, { kind: "ping" }>
type Pong = Extract<PartyMessage, { kind: "pong" }>

/**
 * The party clock: the host's local clock is the reference, and every other member estimates
 * its offset from pings the host answers. A new host means a new reference, so reset().
 */
export class ClockSync {
  private samples: PingSample[] = []
  private counter = 0
  estimate: ClockEstimate | null = null

  constructor(
    private readonly clock: Clock,
    private readonly isReference: () => boolean,
  ) {}

  /** Shared (party) time in milliseconds. */
  now(): number {
    return this.isReference() ? this.clock.now() : sharedNow(this.clock.now(), this.estimate)
  }

  get rttMs(): number {
    return this.estimate?.rttMs ?? 0
  }

  get sampleCount(): number {
    return this.samples.length
  }

  ping(from: string): Ping {
    this.counter += 1
    return { kind: "ping", from, id: `${from}-${this.counter}`, sentAt: this.clock.now() }
  }

  answer(ping: Ping, me: string): Pong {
    const at = this.now()
    return {
      kind: "pong",
      from: me,
      to: ping.from,
      id: ping.id,
      sentAt: ping.sentAt,
      peerReceivedAt: at,
      peerSentAt: at,
    }
  }

  record(pong: Pong): void {
    const { sentAt, peerReceivedAt, peerSentAt } = pong
    this.samples = [
      ...this.samples,
      { sentAt, peerReceivedAt, peerSentAt, receivedAt: this.clock.now() },
    ].slice(-SYNC.pingSamples)
    this.estimate = estimateOffset(this.samples)
  }

  reset(): void {
    this.samples = []
    this.estimate = null
  }
}
