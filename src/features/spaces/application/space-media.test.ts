import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { spacesSetup } from "../testing/spaces-setup"

const picture = (bytes = 10) => new Blob([new Uint8Array(bytes)], { type: "image/webp" })

const setup = async () => {
  const spaces = spacesSetup()
  await spaces.service.create("Us", "blank")
  return { ...spaces, profile: spaces.service.profile }
}

describe("SpaceProfileService pictures", () => {
  it("uploads under a fresh name, points the slot at it and removes the old picture", async () => {
    const { gateway, profile } = await setup()
    expect(await profile.replaceMedia("space-1", "avatar", picture())).toEqual({
      ok: true,
      value: "space-1/avatar/id-1.webp",
    })
    await profile.replaceMedia("space-1", "avatar", picture())
    expect(gateway.spaces[0]?.avatarPath).toBe("space-1/avatar/id-2.webp")
    expect([...gateway.objects.keys()]).toEqual(["space-1/avatar/id-2.webp"])
  })

  it("refuses files over the bucket limit or of another type before uploading", async () => {
    const { gateway, profile } = await setup()
    const result = await profile.replaceMedia("space-1", "cover", picture(5 * 1024 * 1024 + 1))
    expect(result).toMatchObject({ ok: false, error: { kind: "validation" } })
    const gif = new Blob([new Uint8Array(4)], { type: "image/gif" })
    expect((await profile.replaceMedia("space-1", "cover", gif)).ok).toBe(false)
    expect(gateway.objects.size).toBe(0)
  })

  it("removes its own upload when the slot cannot be set", async () => {
    const { gateway, profile } = await setup()
    gateway.setMedia = async () => err(appError("denied", "Only the owner"))
    expect((await profile.replaceMedia("space-1", "cover", picture())).ok).toBe(false)
    expect(gateway.objects.size).toBe(0)
  })

  it("still succeeds when the old picture cannot be removed: cleanup finds it later", async () => {
    const { gateway, profile } = await setup()
    await profile.replaceMedia("space-1", "cover", picture())
    gateway.removeMedia = async () => err(appError("network", "down"))
    expect((await profile.replaceMedia("space-1", "cover", picture())).ok).toBe(true)
  })

  it("clears a slot and removes its picture", async () => {
    const { gateway, profile } = await setup()
    await profile.replaceMedia("space-1", "cover", picture())
    expect((await profile.clearMedia("space-1", "cover")).ok).toBe(true)
    expect(gateway.spaces[0]?.coverPath).toBeNull()
    expect(gateway.objects.size).toBe(0)
    expect((await profile.clearMedia("space-1", "cover")).ok).toBe(true)
  })
})
