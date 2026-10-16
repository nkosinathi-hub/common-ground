import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { appError, err, ok, type Result } from "@/shared/domain"
import { DraftAutosave, RETRY_MS, SAVE_DELAY_MS } from "./draft-autosave.svelte"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup(replies: Result<string>[] = []) {
  const calls: (string | null)[] = []
  const save = async (id: string | null) => {
    calls.push(id)
    return replies.shift() ?? ok("d1")
  }
  return { calls, autosave: new DraftAutosave(save) }
}

describe("DraftAutosave", () => {
  it("creates the draft on the first change, then saves after a pause", async () => {
    const { calls, autosave } = setup()
    autosave.changed()
    expect(autosave.status).toBe("saving")
    await autosave.flush()
    expect(autosave).toMatchObject({ id: "d1", status: "saved" })
    autosave.changed()
    autosave.changed()
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS - 1)
    expect(calls).toEqual([null])
    await vi.advanceTimersByTimeAsync(1)
    await autosave.flush()
    expect(calls).toEqual([null, "d1"])
  })

  it("saves at once on flush, and only when something changed", async () => {
    const { calls, autosave } = setup()
    expect(await autosave.flush()).toBe(true)
    expect(calls).toEqual([])
    autosave.changed()
    autosave.changed()
    expect(await autosave.flush()).toBe(true)
    expect(calls).toEqual([null, "d1"])
  })

  it("says it could not save, and tries again", async () => {
    const { calls, autosave } = setup([err(appError("network", "down"))])
    autosave.changed()
    expect(await autosave.flush()).toBe(false)
    expect(autosave.status).toBe("error")
    await vi.advanceTimersByTimeAsync(RETRY_MS)
    expect(await autosave.flush()).toBe(true)
    expect(calls).toEqual([null, null])
    expect(autosave.status).toBe("saved")
  })

  it("saves nothing once stopped", async () => {
    const { calls, autosave } = setup()
    autosave.stop()
    autosave.changed()
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS)
    expect(await autosave.flush()).toBe(true)
    expect(calls).toEqual([])
  })
})
