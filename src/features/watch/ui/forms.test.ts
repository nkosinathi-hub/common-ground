import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { ME, item } from "../testing/fixtures"
import { ProgressFormState } from "./progress-form-state.svelte"
import { SessionFormState } from "./session-form-state.svelte"
import { TitleFormState } from "./title-form-state.svelte"

const today = () => "2026-10-15" as DateOnly

describe("ProgressFormState", () => {
  it("round-trips saved progress and fills today when completing", () => {
    const form = new ProgressFormState(today)
    form.reset(null)
    expect(form.toInput()).toMatchObject({
      ok: true,
      value: { status: "not_started", season: null },
    })
    form.reset({
      status: "watching",
      season: 2,
      episode: 3,
      completedOn: null,
      userId: ME,
      updatedAt: "",
    })
    expect(form.toInput()).toMatchObject({ ok: true, value: { season: 2, episode: 3 } })
    form.setStatus("completed")
    expect(form.toInput()).toMatchObject({ ok: true, value: { completedOn: "2026-10-15" } })
    form.completedOn = "15/10"
    expect(form.toInput()).toMatchObject({ ok: false, error: { field: "completedOn" } })
  })

  it("rejects bad numbers with the field name", () => {
    const form = new ProgressFormState(today)
    form.season = "x"
    expect(form.toInput()).toMatchObject({ ok: false, error: { field: "season" } })
    form.season = ""
    form.episode = "-2"
    expect(form.toInput()).toMatchObject({ ok: false, error: { field: "episode" } })
  })
})

describe("SessionFormState", () => {
  it("starts with me present and toggles members", () => {
    const form = new SessionFormState(today)
    form.reset([ME])
    form.toggle("b", true)
    form.toggle(ME, false)
    expect(form.isPresent("b")).toBe(true)
    expect(form.toInput()).toEqual({ watchedOn: "2026-10-15", memberIds: ["b"], note: "" })
    form.reset([])
    expect(form.present).toEqual([])
  })
})

describe("TitleFormState", () => {
  it("fills from an item and parses the year", () => {
    const form = new TitleFormState()
    form.fill(item(1, "Dune", { availabilityNote: "Box office" }))
    expect(form.toInput()).toMatchObject({
      ok: true,
      value: { title: "Dune", releaseYear: 2021, availabilityNote: "Box office" },
    })
    form.fill(item(2, "Old", { releaseYear: null }))
    expect(form.year).toBe("")
    form.year = "20x1"
    expect(form.toInput()).toMatchObject({ ok: false, error: { field: "releaseYear" } })
  })
})
