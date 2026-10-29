import { describe, expect, it, vi } from "vitest"
import type { Idea } from "../domain"
import { announceCaptured, onCaptured } from "./captured"

describe("idea captured signal", () => {
  it("reaches a listener until it unsubscribes", () => {
    const handler = vi.fn()
    const stop = onCaptured(handler)
    const idea = { id: "i1", title: "Zine" } as Idea
    announceCaptured(idea)
    stop()
    announceCaptured(idea)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(idea)
  })
})
