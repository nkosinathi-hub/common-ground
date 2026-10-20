import { describe, expect, it } from "vitest"
import { MemoryPlaybackLog } from "./memory-log"

describe("MemoryPlaybackLog", () => {
  it("keeps the most recent attempts only", () => {
    const log = new MemoryPlaybackLog(2)
    for (const ms of [1, 2, 3]) log.record({ providerId: "a", outcome: "ok", ms })
    expect(log.entries().map((e) => e.ms)).toEqual([2, 3])
  })
})
