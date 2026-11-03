import { describe, expect, it } from "vitest"
import { SECTIONS, sectionHref, sectionOf } from "./nav"

describe("sectionOf", () => {
  it("maps every route to its place in the shell", () => {
    expect(sectionOf("home")).toBe("home")
    expect(sectionOf("note")).toBe("notes")
    expect(sectionOf("notes")).toBe("notes")
    expect(sectionOf("watch-item")).toBe("watch")
    expect(sectionOf("party")).toBe("watch")
    expect(sectionOf("idea")).toBe("ideas")
    expect(sectionOf("event")).toBe("calendar")
    expect(sectionOf("settings")).toBe("settings")
    expect(sectionOf("privacy")).toBe("account")
    expect(sectionOf("sign-in")).toBeNull()
  })

  it("keeps the same five destinations, with Notes next to Ideas", () => {
    expect(SECTIONS.map((section) => section.id)).toEqual([
      "home",
      "watch",
      "ideas",
      "notes",
      "calendar",
    ])
    expect(sectionHref("space", "notes")).toBe("#/s/space/home/notes")
  })
})
