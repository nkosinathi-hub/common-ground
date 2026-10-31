import { describe, expect, it } from "vitest"
import { feelingSuggestions, readFeelings, writeFeelings } from "./feelings"

describe("feelings", () => {
  it("keeps suggested words as chips and the rest as the writer's own", () => {
    expect(readFeelings("worried, left out, a bit unseen")).toEqual({
      words: ["worried", "left out"],
      own: "a bit unseen",
    })
    expect(readFeelings("")).toEqual({ words: [], own: "" })
  })

  it("writes chips first, then the own words, and reads its own line back", () => {
    const line = writeFeelings({ words: ["hurt", "tired"], own: " a lot " })
    expect(line).toBe("hurt, tired, a lot")
    expect(readFeelings(line)).toEqual({ words: ["hurt", "tired"], own: "a lot" })
  })

  it("offers the words not yet chosen", () => {
    expect(feelingSuggestions(["hurt"])).not.toContain("hurt")
    expect(feelingSuggestions([])[0]).toBe("hurt")
  })
})
