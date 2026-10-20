import { describe, expect, it } from "vitest"
import { StartFormState } from "./start-form-state.svelte"

const ep = (season: number, episode: number) => ({ season, episode })

describe("StartFormState", () => {
  it("starts from the suggested range, playing in the app", () => {
    const form = new StartFormState()
    form.reset({ from: ep(2, 4), to: ep(2, 4) })
    expect(form.toInput("w1", false)).toEqual({
      watchItemId: "w1",
      source: "jellyfin",
      range: { from: ep(2, 4), to: ep(2, 4) },
    })
  })

  it("sends a film with no range", () => {
    const form = new StartFormState()
    form.source = "external"
    expect(form.toInput("w1", true)).toEqual({ watchItemId: "w1", source: "external", range: null })
  })

  it("asks for the length of each season a range leaves", () => {
    const form = new StartFormState()
    form.reset({ from: ep(1, 5), to: ep(1, 5) })
    expect(form.seasonsLeft).toEqual([])
    form.toSeason = 3
    form.toEpisode = 1
    expect(form.seasonsLeft).toEqual([1, 2])
    form.counts = { 1: 6, 2: 8 }
    expect(form.toInput("w1", false).range).toEqual({
      from: ep(1, 5),
      to: ep(3, 1),
      seasonEpisodeCounts: [6, 8],
    })
  })

  it("sends what was typed, so the service can refuse a missing season length", () => {
    const form = new StartFormState()
    form.reset({ from: ep(1, 5), to: ep(2, 1) })
    expect(form.toInput("w1", false).range?.seasonEpisodeCounts).toEqual([0])
  })
})
