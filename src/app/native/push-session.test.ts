import { describe, expect, it, vi } from "vitest"
import { PushSession } from "./push-session"

function phones() {
  const log: string[] = []
  const start = vi.fn((user: string) => {
    log.push(`start ${user}`)
    return Promise.resolve({ forget: () => Promise.resolve(void log.push(`forget ${user}`)) })
  })
  return { log, start }
}

describe("PushSession", () => {
  it("registers once for the signed-in user", async () => {
    const { log, start } = phones()
    const session = new PushSession(start)
    await session.follow("ana")
    await session.follow("ana")
    expect(log).toEqual(["start ana"])
  })

  it("forgets the phone when the session ends, however it ends", async () => {
    const { log, start } = phones()
    const session = new PushSession(start)
    await session.follow("ana")
    await session.follow(null)
    expect(log).toEqual(["start ana", "forget ana"])
  })

  it("hands the phone over when another user signs in, forgetting first", async () => {
    const { log, start } = phones()
    const session = new PushSession(start)
    await session.follow("ana")
    await session.follow("ben")
    expect(log).toEqual(["start ana", "forget ana", "start ben"])
  })

  it("keeps working after a start that failed", async () => {
    const start = vi
      .fn()
      .mockRejectedValueOnce(new Error("firebase down"))
      .mockResolvedValue({ forget: () => Promise.resolve() })
    const session = new PushSession(start)
    await expect(session.follow("ana")).resolves.toBeUndefined()
    await expect(session.follow(null)).resolves.toBeUndefined()
    await session.follow("ana")
    expect(start).toHaveBeenCalledTimes(2)
  })
})
