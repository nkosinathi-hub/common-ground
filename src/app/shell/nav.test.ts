import { describe, expect, it } from "vitest"
import { sectionOf } from "./nav"

describe("sectionOf", () => {
  it("maps every space route to its primary destination", () => {
    expect(sectionOf("home")).toBe("home")
    expect(sectionOf("watch")).toBe("watch")
    expect(sectionOf("watch-item")).toBe("watch")
    expect(sectionOf("ideas")).toBe("ideas")
    expect(sectionOf("idea")).toBe("ideas")
    expect(sectionOf("settings")).toBeNull()
  })
})
