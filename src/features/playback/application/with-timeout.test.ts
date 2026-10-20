import { describe, expect, it } from "vitest"
import { ok } from "../../../shared/domain/result"
import { abortableSleep, withTimeout } from "./with-timeout"

describe("withTimeout", () => {
  it("passes a quick answer through", async () => {
    expect(await withTimeout(async () => ok(1), 100)).toEqual({ result: ok(1), timedOut: false })
  })

  it("aborts the task's signal and answers a timeout even if the task ignores it", async () => {
    let seen: AbortSignal | null = null
    const outcome = await withTimeout((signal) => {
      seen = signal
      return new Promise(() => {})
    }, 20)
    expect(outcome.timedOut).toBe(true)
    expect(outcome.result).toMatchObject({ ok: false, error: { kind: "network" } })
    expect((seen as AbortSignal | null)?.aborted).toBe(true)
  })

  it("follows the caller's abort", async () => {
    const parent = new AbortController()
    const pending = withTimeout(() => new Promise(() => {}), 5_000, parent.signal)
    parent.abort()
    expect((await pending).result).toMatchObject({ ok: false, error: { kind: "network" } })
  })

  it("turns a throw into an unknown error", async () => {
    const outcome = await withTimeout(() => Promise.reject(new Error("boom")), 100)
    expect(outcome).toMatchObject({
      timedOut: false,
      result: { ok: false, error: { kind: "unknown" } },
    })
  })
})

describe("abortableSleep", () => {
  it("waits, and stops early on abort", async () => {
    const started = Date.now()
    await abortableSleep(10)
    expect(Date.now() - started).toBeGreaterThanOrEqual(8)
    const controller = new AbortController()
    controller.abort()
    await abortableSleep(5_000, controller.signal)
  })
})
