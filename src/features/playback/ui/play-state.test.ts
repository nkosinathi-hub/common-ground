import { describe, expect, it } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { PlaybackService } from "../application/playback-service"
import type { MediaRef } from "../domain/media-ref"
import { fakeSource } from "../testing/fake-plugin"
import { PlayState } from "./play-state.svelte"

const show = { spaceId: "s", itemId: "i", catalog: { type: "tv", id: 1399 } } as const
const ports = {
  nextEpisode: async () => ok({ season: 2, episode: 1 }),
  nextUp: async () => ok(null),
  markWatched: async () => ok(undefined),
}

function service(answer: (ref: MediaRef) => Promise<unknown>) {
  const resolver = { resolve: answer as never, providerFor: () => undefined }
  return new PlaybackService(resolver, ports)
}

describe("PlayState", () => {
  it("loads this person's episode and its ranked sources", async () => {
    const found = ok({ best: fakeSource("a", "a"), fallbacks: [fakeSource("b", "b")] })
    const state = new PlayState(
      service(async () => found),
      () => show,
    )
    const pending = state.open()
    expect(state.status).toBe("loading")
    await pending
    expect(state.status).toBe("ready")
    expect(state.playing?.ref).toMatchObject({ season: 2, episode: 1 })
    expect(state.playing?.sources).toHaveLength(2)
  })

  it("shows the error when nothing can play", async () => {
    const state = new PlayState(
      service(async () => err(appError("not_found", "None"))),
      () => show,
    )
    await state.open({ season: 1, episode: 1 })
    expect(state.status).toBe("error")
    expect(state.error?.message).toBe("None")
  })

  it("ignores a superseded answer and closes cleanly", async () => {
    let release: (value: unknown) => void = () => {}
    const slow = new Promise((resolve) => (release = resolve))
    const state = new PlayState(
      service(() => slow),
      () => show,
    )
    const first = state.open()
    state.close()
    release(ok({ best: fakeSource("a", "a"), fallbacks: [] }))
    await first
    expect(state.status).toBe("idle")
    expect(state.playing).toBeNull()
  })
})
