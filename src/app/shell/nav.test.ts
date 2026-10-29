import { describe, expect, it } from "vitest"
import { sectionOf } from "./nav"

describe("sectionOf", () => {
  it("maps every route to its place in the shell", () => {
    expect(sectionOf("home")).toBe("home")
    expect(sectionOf("note")).toBe("home")
    expect(sectionOf("watch-item")).toBe("watch")
    expect(sectionOf("party")).toBe("watch")
    expect(sectionOf("idea")).toBe("ideas")
    expect(sectionOf("event")).toBe("calendar")
    expect(sectionOf("settings")).toBe("settings")
    expect(sectionOf("privacy")).toBe("account")
    expect(sectionOf("sign-in")).toBeNull()
  })
})
