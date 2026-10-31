import { describe, expect, it } from "vitest"
import { placeRows } from "./place-rows"

const person = (name: string, label: string, ahead = false) => ({
  userId: name.toLowerCase(),
  name,
  label,
  ahead,
})

describe("placeRows", () => {
  it("puts people at the same episode on one line", () => {
    const rows = placeRows(
      { together: "S1E2", people: [person("Ana", "S1E2"), person("Ben", "S1E2")] },
      2,
    )
    expect(rows).toEqual([
      { names: ["Ana", "Ben"], ids: ["ana", "ben"], label: "S1E2", ahead: false },
    ])
  })

  it("never shows more lines than asked, folding the rest into the last", () => {
    const people = [
      person("Ana", "S1E3"),
      person("Cy", "S1E4", true),
      person("Dee", "S1E3"),
      person("Eve", "S1E2"),
      person("Fin", "S1E5", true),
    ]
    const rows = placeRows({ together: "S1E3", people }, 2)
    expect(rows).toEqual([
      { names: ["Ana", "Dee"], ids: ["ana", "dee"], label: "S1E3", ahead: false },
      { names: ["Cy", "Eve", "Fin"], ids: ["cy", "eve", "fin"], label: null, ahead: false },
    ])
  })

  it("keeps every line when there is room", () => {
    const rows = placeRows(
      { together: null, people: [person("Ana", "S1E1"), person("Ben", "S2E1", true)] },
      3,
    )
    expect(rows.map((r) => r.label)).toEqual(["S1E1", "S2E1"])
    expect(rows[1]!.ahead).toBe(true)
  })
})
