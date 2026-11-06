import { describe, expect, it } from "vitest"
import { Play } from "@lucide/svelte"
import { PageActions } from "./page-actions.svelte"

describe("contextual page tools", () => {
  it("keeps registration order and removes only the departing tool", () => {
    const actions = new PageActions()
    const episodes = { label: "Episodes", icon: Play, onclick: () => {} }
    const trailer = { ...episodes, label: "Watch trailer" }
    const leave = actions.registerTool(episodes)
    const leaveTrailer = actions.registerTool(trailer)
    expect(actions.tools).toEqual([episodes, trailer])
    leave()
    expect(actions.tools).toEqual([trailer])
    leaveTrailer()
    expect(actions.tools).toEqual([])
  })
  it("keeps explicit tool positions stable when asynchronous actions register later", () => {
    const actions = new PageActions()
    const tool = { label: "About", icon: Play, onclick: () => {}, order: 40 }
    actions.registerTool(tool)
    actions.registerTool({ ...tool, label: "Trailer", order: 20 })
    const leave = actions.registerTool({ ...tool, label: "Episodes", order: 10 })
    expect(actions.tools.map((entry) => entry.label)).toEqual(["Episodes", "Trailer", "About"])
    leave()
    expect(actions.tools.map((entry) => entry.label)).toEqual(["Trailer", "About"])
  })
})
