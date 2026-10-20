import type { Clock, PlayerControl } from "../application/ports"

/** A player that plays in real time on the given clock; records every control call. */
export class FakePlayer implements PlayerControl {
  playing = false
  rate = 1
  calls: string[] = []
  private position = 0
  private since: number
  private listeners = new Set<(buffering: boolean) => void>()

  constructor(private readonly clock: Clock) {
    this.since = clock.now()
  }

  private settle(): void {
    const now = this.clock.now()
    if (this.playing) this.position += ((now - this.since) / 1000) * this.rate
    this.since = now
  }

  play(): Promise<void> {
    this.settle()
    this.playing = true
    this.calls.push("play")
    return Promise.resolve()
  }

  pause(): void {
    this.settle()
    this.playing = false
    this.calls.push("pause")
  }

  seek(seconds: number): void {
    this.settle()
    this.position = seconds
    this.calls.push(`seek:${seconds}`)
  }

  setRate(rate: number): void {
    this.settle()
    this.rate = rate
    this.calls.push(`rate:${rate}`)
  }

  currentTime(): number {
    this.settle()
    return this.position
  }

  onBuffering(listener: (buffering: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** The video stalls (true) or can play again (false). */
  buffer(buffering: boolean): void {
    for (const listener of this.listeners) listener(buffering)
  }
}
