import { describe, expect, it } from "vitest"
import { isRetryable, withRetry } from "../../tests/e2e/support/retry"

const noWait = () => Promise.resolve()

describe("withRetry", () => {
  it("retries transient failures up to three attempts", async () => {
    let calls = 0
    const value = await withRetry(async () => {
      calls += 1
      if (calls < 3)
        throw Object.assign(new Error("request timed out"), { name: "AuthRetryableFetchError" })
      return "ok"
    }, noWait)
    expect([value, calls]).toEqual(["ok", 3])
  })

  it("gives up after the third transient failure", async () => {
    let calls = 0
    const failing = withRetry(async () => {
      calls += 1
      throw Object.assign(new Error("bad gateway"), { status: 502 })
    }, noWait)
    await expect(failing).rejects.toThrow("bad gateway")
    expect(calls).toBe(3)
  })

  it("does not retry a real error", async () => {
    let calls = 0
    const failing = withRetry(async () => {
      calls += 1
      throw Object.assign(new Error("email exists"), { status: 422 })
    }, noWait)
    await expect(failing).rejects.toThrow("email exists")
    expect(calls).toBe(1)
  })
})

describe("isRetryable", () => {
  it("treats retryable fetch errors, timeouts and 5xx as transient", () => {
    expect(isRetryable({ name: "AuthRetryableFetchError" })).toBe(true)
    expect(isRetryable({ status: 503 })).toBe(true)
    expect(isRetryable({ status: 429 })).toBe(true)
    expect(isRetryable({ status: 400 })).toBe(false)
    expect(isRetryable(null)).toBe(false)
  })
})
