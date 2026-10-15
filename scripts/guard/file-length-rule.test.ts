import { describe, expect, it } from "vitest"
import { countLines, findLengthViolations, MAX_LINES } from "./file-length-rule"

const lines = (n: number) => "x\n".repeat(n)

describe("file length rule", () => {
  it("counts lines with or without a trailing newline", () => {
    expect(countLines("a\nb\n")).toBe(2)
    expect(countLines("a\nb")).toBe(2)
    expect(countLines("")).toBe(0)
  })

  it("flags files over the limit and allows the limit itself", () => {
    const result = findLengthViolations([
      { path: "src/ok.ts", text: lines(MAX_LINES) },
      { path: "src/big.ts", text: lines(MAX_LINES + 1) },
    ])
    expect(result).toEqual([{ path: "src/big.ts", lines: 101 }])
  })

  it("exempts generated files only", () => {
    const big = lines(500)
    expect(
      findLengthViolations([
        { path: "pnpm-lock.yaml", text: big },
        { path: "src/shared/infrastructure/database.types.ts", text: big },
        { path: "supabase/migrations/x.sql", text: big },
      ]).map((v) => v.path),
    ).toEqual(["supabase/migrations/x.sql"])
  })
})
