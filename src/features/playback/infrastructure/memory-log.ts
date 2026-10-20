import type { LogEntry, PlaybackLog } from "../domain/plugin.types"

/** The last attempts, timings and failure reasons, kept in memory for troubleshooting. */
export class MemoryPlaybackLog implements PlaybackLog {
  private readonly kept: LogEntry[] = []

  constructor(private readonly limit = 100) {}

  record(entry: LogEntry): void {
    this.kept.push(entry)
    if (this.kept.length > this.limit) this.kept.shift()
  }

  entries(): readonly LogEntry[] {
    return this.kept
  }
}
