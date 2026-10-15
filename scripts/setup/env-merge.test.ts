import { describe, expect, it } from "vitest"
import { mergeEnv, parseEnv } from "./env-merge"

const EXAMPLE = "# public\nA=1\nB=two\n# base\nC=/\n"

describe("env merge", () => {
  it("parses keys and ignores comments and blanks", () => {
    expect(parseEnv("# x\nA=1\n\nB = b=c\n")).toEqual(
      new Map([
        ["A", "1"],
        ["B", "b=c"],
      ]),
    )
  })

  it("copies the whole example when there is no .env", () => {
    expect(mergeEnv(EXAMPLE, null)).toEqual({ text: EXAMPLE, added: ["A", "B", "C"] })
  })

  it("applies overrides only to keys it adds", () => {
    const { text } = mergeEnv(EXAMPLE, null, { B: "local" })
    expect(text).toBe("# public\nA=1\nB=local\n# base\nC=/\n")
  })

  it("appends missing keys and never rewrites existing lines", () => {
    const current = "A=mine\n# keep me\nZ=9"
    const { text, added } = mergeEnv(EXAMPLE, current, { A: "ignored", C: "/x/" })
    expect(added).toEqual(["B", "C"])
    expect(text).toBe("A=mine\n# keep me\nZ=9\n# added by pnpm setup\nB=two\nC=/x/\n")
  })

  it("is a no-op when every key is present", () => {
    const current = "A=a\nB=b\nC=c\n"
    expect(mergeEnv(EXAMPLE, current)).toEqual({ text: current, added: [] })
  })
})
