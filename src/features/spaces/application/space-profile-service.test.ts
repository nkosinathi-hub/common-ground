import { describe, expect, it } from "vitest"
import { spacesSetup } from "../testing/spaces-setup"
import type { GeneralFields } from "./space-profile-service"

const setup = async () => {
  const spaces = spacesSetup()
  await spaces.service.create("Us", "blank")
  return { ...spaces, profile: spaces.service.profile }
}
const general: GeneralFields = {
  name: "Us two",
  template: "couple",
  tagline: " Hi ",
  description: "",
  icon: null,
}

describe("SpaceProfileService words, look and layout", () => {
  it("validates and saves the general fields in one write", async () => {
    const { gateway, profile } = await setup()
    expect((await profile.saveGeneral("space-1", { ...general, name: " " })).ok).toBe(false)
    expect(await profile.saveGeneral("space-1", { ...general, icon: "skull" })).toMatchObject({
      error: { field: "icon" },
    })
    expect(
      (await profile.saveGeneral("space-1", { ...general, tagline: "x".repeat(121) })).ok,
    ).toBe(false)
    expect(
      (await profile.saveGeneral("space-1", { ...general, description: "x".repeat(1001) })).ok,
    ).toBe(false)
    expect(gateway.patches).toEqual([])
    expect((await profile.saveGeneral("space-1", { ...general, icon: "heart" })).ok).toBe(true)
    expect(gateway.patches).toEqual([
      { name: "Us two", template: "couple", tagline: "Hi", description: "", icon: "heart" },
    ])
    expect(gateway.spaces[0]).toMatchObject({ name: "Us two", tagline: "Hi", icon: "heart" })
  })

  it("normalises the accent and saves it with the preset", async () => {
    const { gateway, profile } = await setup()
    expect((await profile.saveLook("space-1", { theme: "ocean", accent: "red" })).ok).toBe(false)
    expect((await profile.saveLook("space-1", { theme: "ocean", accent: "#ABC" })).ok).toBe(true)
    expect(gateway.spaces[0]).toMatchObject({ theme: "ocean", accent: "#aabbcc" })
  })

  it("saves the Home layout and preferences as given", async () => {
    const { gateway, profile } = await setup()
    await profile.saveHomeCards("space-1", ["ideas", "notes"])
    await profile.savePreferences("space-1", {
      defaultWatchIntent: "watch_together",
      weekStartsOn: 0,
    })
    expect(gateway.spaces[0]).toMatchObject({
      homeCards: ["ideas", "notes"],
      defaultWatchIntent: "watch_together",
      weekStartsOn: 0,
    })
  })
})
