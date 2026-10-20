import { describe, expect, it } from "vitest"
import { addedNote } from "./connection"

describe("addedNote", () => {
  it("words what a sync brought in", () => {
    expect(addedNote(0)).toBe("Nothing new from Simkl")
    expect(addedNote(1)).toBe("Added 1 watch from Simkl")
    expect(addedNote(12)).toBe("Added 12 watches from Simkl")
  })
})
