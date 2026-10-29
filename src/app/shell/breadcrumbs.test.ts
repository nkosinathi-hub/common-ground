import { describe, expect, it } from "vitest"
import { crumbsOf } from "./breadcrumbs"

const spaceId = "8f9c2d1e-0b5a-4c3f-9e7d-112233445566"
const noteId = "0a1b2c3d-4e5f-4a6b-8c7d-998877665544"

describe("crumbsOf", () => {
  it("leads with the space and ends on the page", () => {
    expect(crumbsOf({ name: "home", spaceId }, "Ana & Ben")).toEqual([
      { label: "Ana & Ben", href: `#/s/${spaceId}/home` },
      { label: "Home" },
    ])
  })

  it("walks up through every parent, naming the page by its title when given", () => {
    const crumbs = crumbsOf({ name: "note", spaceId, noteId }, "Ana & Ben")
    expect(crumbs.map((c) => c.label)).toEqual(["Ana & Ben", "Home", "Notes", "Note"])
    expect(crumbs[2]!.href).toBe(`#/s/${spaceId}/home/notes`)
    const title = crumbsOf(
      { name: "watch-item", spaceId, itemId: noteId },
      "Ana & Ben",
      "Ted Lasso",
    )
    expect(title.map((c) => c.label)).toEqual(["Ana & Ben", "Watch", "Ted Lasso"])
  })

  it("puts Privacy under Account, with no space", () => {
    expect(crumbsOf({ name: "privacy", part: "rights" }, "Ana & Ben")).toEqual([
      { label: "Account", href: "#/account" },
      { label: "Privacy" },
    ])
  })
})
