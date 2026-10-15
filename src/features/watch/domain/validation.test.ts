import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { parseCount, parseYear, validateDetails, validateProgress } from "./validation"

const details = { title: " Dune ", mediaType: "movie", releaseYear: 2021, synopsis: " x " } as const
const field = (r: { ok: boolean; error?: { field?: string } }) => (r.ok ? null : r.error?.field)

describe("title validation", () => {
  it("trims and accepts a valid title", () => {
    expect(validateDetails({ ...details, availabilityNote: "  " })).toEqual({
      ok: true,
      value: {
        title: "Dune",
        mediaType: "movie",
        releaseYear: 2021,
        synopsis: "x",
        availabilityNote: null,
      },
    })
  })

  it("names the field that is wrong", () => {
    expect(field(validateDetails({ ...details, title: " ", availabilityNote: null }))).toBe("title")
    const long = "x".repeat(201)
    expect(field(validateDetails({ ...details, title: long, availabilityNote: null }))).toBe(
      "title",
    )
    expect(field(validateDetails({ ...details, releaseYear: 1800, availabilityNote: null }))).toBe(
      "releaseYear",
    )
    const synopsis = "x".repeat(2001)
    expect(field(validateDetails({ ...details, synopsis, availabilityNote: null }))).toBe(
      "synopsis",
    )
    const note = "x".repeat(501)
    expect(field(validateDetails({ ...details, availabilityNote: note }))).toBe("availabilityNote")
  })

  it("parses optional numbers from inputs", () => {
    expect(parseYear("")).toEqual({ ok: true, value: null })
    expect(parseYear("1999")).toEqual({ ok: true, value: 1999 })
    expect(parseYear("19x9").ok).toBe(false)
    expect(parseCount(" 3 ", "season")).toEqual({ ok: true, value: 3 })
    expect(parseCount("", "episode")).toEqual({ ok: true, value: null })
    expect(field(parseCount("-1", "episode"))).toBe("episode")
  })
})

describe("progress validation", () => {
  const base = {
    status: "watching",
    season: 1,
    episode: 2,
    rating: null,
    completedOn: null,
  } as const
  it("accepts ratings 1 to 5 only", () => {
    expect(validateProgress({ ...base, rating: 5 }).ok).toBe(true)
    expect(field(validateProgress({ ...base, rating: 6 }))).toBe("rating")
    expect(field(validateProgress({ ...base, rating: 0 }))).toBe("rating")
    expect(field(validateProgress({ ...base, rating: 2.5 }))).toBe("rating")
  })

  it("rejects negative episodes and a completed date that is not completed", () => {
    expect(field(validateProgress({ ...base, season: -1 }))).toBe("season")
    expect(field(validateProgress({ ...base, episode: 1.5 }))).toBe("episode")
    const day = "2026-10-01" as DateOnly
    expect(validateProgress({ ...base, completedOn: day })).toMatchObject({
      ok: true,
      value: { completedOn: null },
    })
    expect(validateProgress({ ...base, status: "completed", completedOn: day })).toMatchObject({
      ok: true,
      value: { completedOn: day },
    })
  })
})
