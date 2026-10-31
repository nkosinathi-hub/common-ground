import { describe, expect, it } from "vitest"
import { settingsTabOf, settingsTabsFor } from "./settings-tabs"

describe("settings tabs", () => {
  it("gives the owner all four tabs and a member two", () => {
    expect(settingsTabsFor("owner")).toEqual(["identity", "look", "home", "members"])
    expect(settingsTabsFor("member")).toEqual(["home", "members"])
  })

  it("opens the tab asked for, or the viewer's first when it is missing or not theirs", () => {
    expect(settingsTabOf("owner", "look")).toBe("look")
    expect(settingsTabOf("owner", undefined)).toBe("identity")
    expect(settingsTabOf("member", "identity")).toBe("home")
  })
})
