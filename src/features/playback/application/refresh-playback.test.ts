import { expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import { fakeSource } from "../testing/fake-plugin"
import { refreshPlayback } from "./refresh-playback"
it("invalidates cached links before a fresh policy-checked resolve without trailers", async () => {
  const source = fakeSource("cinepro", "a")
  const ref = { kind: "episode", tmdbId: 1396, season: 2, episode: 1 } as const
  const refresh = vi.fn(async () => ok(undefined))
  const resolve = vi.fn(async () => ok({ best: source, fallbacks: [] }))
  const resolver = {
    resolve,
    providerFor: () => ({
      id: "cinepro",
      supports: () => true,
      resolve: vi.fn(),
      health: vi.fn(),
      refresh,
    }),
  }
  const signal = new AbortController().signal
  await refreshPlayback(
    resolver,
    { spaceId: "s", itemId: "i", catalog: { type: "tv", id: 1396 } },
    { ref, sources: [source] },
    source,
    signal,
  )
  expect(refresh).toHaveBeenCalledWith(source, expect.any(AbortSignal))
  expect(resolve).toHaveBeenCalledWith(ref, { signal, excludeProviderIds: ["youtube-trailer"] })
  expect(refresh.mock.invocationCallOrder[0]).toBeLessThan(resolve.mock.invocationCallOrder[0]!)
})
