import { expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import type { PlaybackService } from "../application/playback-service"
import { SourceSession } from "./source-session.svelte"
import { target, first, second, ref } from "../testing/source-session-fixture"

it("allows an explicit retry of a previously failed source to fall back again", async () => {
  const session = new SourceSession(
    { ref, sources: [first, second] },
    {} as PlaybackService,
    target,
  )
  await session.fail(first, 50)
  session.select(0, 50)
  await session.fail(first, 51)
  expect(session.source?.url).toBe(second.url)
})

it("preserves the saved position when explicitly retrying after exhausted recovery", async () => {
  const refresh = vi.fn(async () => ok({ ref, sources: [second] }))
  const session = new SourceSession(
    { ref, sources: [first] },
    { refresh } as unknown as PlaybackService,
    target,
  )
  await session.fail(first, 65)
  await session.fail(second, 66)
  expect(session.source).toBeNull()
  await session.retry()
  expect(session.source).toMatchObject({ url: second.url, resumeSeconds: 66 })
})
