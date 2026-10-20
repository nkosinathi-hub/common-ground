import { cleanup, render } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { fileSource, playerFakes } from "../testing/render-player"
import { providePlayback } from "./context"
import Player from "./Player.svelte"

afterEach(cleanup)

describe("Player and a watch party", () => {
  it("hands its video to the party while it plays, and takes it back on close", async () => {
    const detach = vi.fn()
    const attachVideo = vi.fn(() => detach)
    const fakes = playerFakes([fileSource("https://a.example.org/1.mp4")], {
      nextUp: vi.fn(async () => ok(null)),
    })
    const props = {
      playing: {
        ref: { kind: "movie", tmdbId: 603 },
        sources: [fileSource("https://a.example.org/1.mp4")],
      },
      target: { spaceId: "s", itemId: "i", catalog: { type: "movie", id: 603 } },
      title: "Film",
      onclose: () => {},
      onnext: () => {},
    } as const
    const view = render(Provided, {
      props: {
        provide: () => providePlayback({ ...fakes, attachVideo }),
        component: Player,
        props,
      },
    })
    await vi.waitFor(() =>
      expect(attachVideo).toHaveBeenCalledWith(document.querySelector("video")),
    )
    view.unmount()
    expect(detach).toHaveBeenCalledOnce()
  })
})
