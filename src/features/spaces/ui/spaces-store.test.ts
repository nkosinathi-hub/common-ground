import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { sampleSpace } from "../testing/sample-space"
import { spacesSetup } from "../testing/spaces-setup"
import { SpacesStore } from "./spaces-store.svelte"

const setup = () => {
  const spaces = spacesSetup()
  return { ...spaces, store: new SpacesStore(spaces.service) }
}

describe("SpacesStore", () => {
  it("loads memberships and only activates spaces the user is in", async () => {
    const { gateway, active, store } = setup()
    gateway.spaces.push(sampleSpace({ id: "a" }))
    gateway.spaces.push(sampleSpace({ id: "b", role: "member" }))
    await store.refresh()
    expect(store.status).toBe("ready")
    expect(store.activate("b")).toBe(true)
    expect(active.value).toBe("b")
    expect(store.activate("stranger")).toBe(false)
    expect(store.active).toBeNull()
  })

  it("clears everything on sign-out", async () => {
    const { gateway, active, store } = setup()
    gateway.spaces.push(sampleSpace({ id: "a" }))
    await store.refresh()
    store.clear()
    expect(store.spaces).toEqual([])
    expect(active.value).toBeNull()
  })

  it("reports load failures, then recovers on retry", async () => {
    const { gateway, store } = setup()
    const listMine = gateway.listMine.bind(gateway)
    gateway.listMine = async () => err(appError("network", "down"))
    await store.refresh()
    expect(store.status).toBe("error")
    expect(store.error?.kind).toBe("network")
    gateway.listMine = listMine
    await store.refresh()
    expect(store.status).toBe("ready")
    expect(store.error).toBeNull()
  })
  it("signs every avatar and cover in one batch and serves them from the cache", async () => {
    const { gateway, store } = setup()
    gateway.spaces.push(sampleSpace({ id: "a", avatarPath: "a/avatar/1.webp" }))
    gateway.spaces.push(sampleSpace({ id: "b", coverPath: "b/cover/2.webp" }))
    await store.refresh()
    expect(store.mediaUrl("a/avatar/1.webp")).toBe("https://signed.test/a/avatar/1.webp")
    expect(store.mediaUrl("b/cover/2.webp")).toBe("https://signed.test/b/cover/2.webp")
    expect(store.mediaUrl(null)).toBeNull()
    store.clear()
    expect(store.mediaUrl("a/avatar/1.webp")).toBeNull()
  })
})
