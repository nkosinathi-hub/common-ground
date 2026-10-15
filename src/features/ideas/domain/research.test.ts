import { describe, expect, it } from "vitest"
import { validateHypothesis, validateNote, validateResearchLink } from "./research"

describe("validateResearchLink", () => {
  it.each(["https://example.com/a?b=1", "http://example.com"])("accepts %s", (url) => {
    expect(validateResearchLink({ url, title: "T", description: "" }).ok).toBe(true)
  })

  it.each([
    "ftp://example.com",
    "javascript:alert(1)",
    "mailto:a@b.c",
    "example.com",
    "https://",
    "data:text/html,x",
  ])("rejects %s", (url) => {
    const result = validateResearchLink({ url, title: "T", description: "" })
    expect(result.ok ? null : result.error.field).toBe("url")
  })

  it("requires a title and trims fields", () => {
    expect(validateResearchLink({ url: "https://x.dev", title: " ", description: "" }).ok).toBe(
      false,
    )
    expect(
      validateResearchLink({ url: " https://x.dev ", title: " Rent ", description: " d " }),
    ).toEqual({ ok: true, value: { url: "https://x.dev", title: "Rent", description: "d" } })
  })
})

describe("notes and hypotheses", () => {
  it("rejects empty or oversized text", () => {
    expect(validateNote("  ").ok).toBe(false)
    expect(validateNote("x".repeat(10001)).ok).toBe(false)
    expect(validateNote(" Call ")).toEqual({ ok: true, value: "Call" })
    expect(validateHypothesis("x".repeat(1001)).ok).toBe(false)
  })
})
