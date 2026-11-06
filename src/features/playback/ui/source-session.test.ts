import { describe, expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import type { PlaybackService } from "../application/playback-service"
import { target, first, second, ref } from "../testing/source-session-fixture"
import { SourceSession } from "./source-session.svelte"

describe("bounded source recovery", () => {
  it("keeps position, ignores old engine errors and refreshes only once", async () => {
    const refresh = vi.fn(async () => ok({ ref, sources: [first] }))
    const session = new SourceSession(
      { ref, sources: [first, second] },
      { refresh } as unknown as PlaybackService,
      target,
    )
    await session.fail(first, 65)
    expect(session.source).toMatchObject({ url: second.url, resumeSeconds: 65 })
    await session.fail(first, 0)
    expect(session.index).toBe(1)
    await session.fail(second, 67)
    expect(refresh).toHaveBeenCalledOnce()
    expect(session.source).toMatchObject({ url: first.url, resumeSeconds: 67 })
    await session.fail(first, 70)
    expect(session.source).toBeNull()
    expect(refresh).toHaveBeenCalledOnce()
  })
  it("does not apply a refresh after the player closes", async () => {
    let release = () => {}
    const refresh = () =>
      new Promise<ReturnType<typeof ok<{ ref: typeof ref; sources: (typeof first)[] }>>>(
        (resolve) => {
          release = () => resolve(ok({ ref, sources: [second] }))
        },
      )
    const session = new SourceSession(
      { ref, sources: [first] },
      { refresh } as unknown as PlaybackService,
      target,
    )
    const pending = session.fail(first, 61)
    session.dispose()
    release()
    await pending
    expect(session.source).toBeNull()
  })
})

it("renews an expired link without resuming a deliberately paused viewer", async () => {
  const refresh = vi.fn(async () => ok({ ref, sources: [second] }))
  const session = new SourceSession(
    { ref, sources: [first] },
    { refresh } as unknown as PlaybackService,
    target,
  )
  await session.fail(first, 30, true, true)
  expect(session.autoplay).toBe(false)
  expect(session.source).toMatchObject({ url: second.url, resumeSeconds: 30 })
})

it("keeps a manual source change paused and rejects an invalid index", () => {
  const session = new SourceSession(
    { ref, sources: [first, second] },
    {} as PlaybackService,
    target,
  )
  session.select(1, 12, true)
  expect(session.source).toMatchObject({ url: second.url, resumeSeconds: 12 })
  expect(session.autoplay).toBe(false)
  session.select(99, 0)
  expect(session.index).toBe(1)
  session.ready()
  expect(session.autoplay).toBe(true)
})
