import { describe, expect, it } from "vitest"
import { checkDuplication, DUPLICATION } from "./duplication-rule"

const clone = (a: string, b: string, lines = 8) => ({
  lines,
  firstFile: { name: a, start: 1 },
  secondFile: { name: b, start: 3 },
})

describe("duplication rule", () => {
  it("passes at or below the recorded level", () => {
    const report = { statistics: { total: { percentage: DUPLICATION.maxPercent } }, duplicates: [] }
    expect(checkDuplication(report)).toEqual([])
  })

  it("fails above it and lists every clone so the new one can be found", () => {
    const report = {
      statistics: { total: { percentage: DUPLICATION.maxPercent + 0.01 } },
      duplicates: [clone("src/a.ts", "src/b.ts"), clone("src/c.ts", "src/d.ts", 12)],
    }
    const problems = checkDuplication(report)
    expect(problems[0]).toMatch(/duplicated lines .* above the 0\.\d+% limit/)
    expect(problems).toContain("src/a.ts:1 and src/b.ts:3 (8 lines)")
    expect(problems).toHaveLength(3)
  })

  it("never scans applied migrations, vendored components or generated types", () => {
    expect(DUPLICATION.ignore).toEqual(
      expect.arrayContaining([
        "supabase/migrations/**",
        "src/lib/components/ui/**",
        "**/database.types.ts",
      ]),
    )
  })
})
