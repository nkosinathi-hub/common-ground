import { describe, expect, it } from "vitest"
import {
  authorLabel,
  CONFIRM_WORD,
  exportFilename,
  validateConfirmation,
  validateDisplayName,
} from "./account"

const day = new Date(2026, 9, 5, 23, 30)

describe("exportFilename", () => {
  it("slugs the space name and stamps the local date", () => {
    expect(exportFilename("Our Trip: 2027!", day)).toBe(
      "common-ground-our-trip-2027-2026-10-05.json",
    )
  })

  it("trims separators and falls back when nothing is left", () => {
    expect(exportFilename("  --Home--  ", day)).toBe("common-ground-home-2026-10-05.json")
    expect(exportFilename("***", day)).toBe("common-ground-space-2026-10-05.json")
    expect(exportFilename("", day)).toBe("common-ground-space-2026-10-05.json")
  })
})

describe("validateConfirmation", () => {
  it("accepts only the exact word", () => {
    expect(validateConfirmation(CONFIRM_WORD).ok).toBe(true)
    const wrong = validateConfirmation("delete")
    expect(wrong.ok).toBe(false)
    if (!wrong.ok) expect(wrong.error).toMatchObject({ kind: "validation", field: "confirmation" })
  })
})

describe("validateDisplayName", () => {
  it("trims and accepts 1 to 80 characters", () => {
    expect(validateDisplayName("  Ana ")).toEqual({ ok: true, value: "Ana" })
    expect(validateDisplayName("x".repeat(80)).ok).toBe(true)
  })

  it("rejects blank or too long names on the name field", () => {
    for (const bad of ["   ", "x".repeat(81)]) {
      const result = validateDisplayName(bad)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.field).toBe("displayName")
    }
  })
})

describe("authorLabel", () => {
  it("names former members when the author is gone", () => {
    expect(authorLabel("Ana")).toBe("Ana")
    expect(authorLabel(null)).toBe("Former member")
    expect(authorLabel(undefined)).toBe("Former member")
  })
})
