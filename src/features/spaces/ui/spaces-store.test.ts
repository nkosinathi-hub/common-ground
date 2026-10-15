import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { spacesSetup } from "../testing/spaces-setup"
import { SpacesStore } from "./spaces.svelte"

const setup = () => {
  const spaces = spacesSetup()
  return { ...spaces, store: new SpacesStore(spaces.service) }
}

describe("SpacesStore", () => {
  it("loads memberships and only activates spaces the user is in", async () => {
    const { gateway, active, store } = setup()
    gateway.spaces.push({ id: "a", name: "A", template: "blank", role: "owner" })
    gateway.spaces.push({ id: "b", name: "B", template: "couple", role: "member" })
    await store.refresh()
    expect(store.status).toBe("ready")
    expect(store.activate("b")).toBe(true)
    expect(active.value).toBe("b")
    expect(store.activate("stranger")).toBe(false)
    expect(store.active).toBeNull()
  })

  it("clears everything on sign-out", async () => {
    const { gateway, active, store } = setup()
    gateway.spaces.push({ id: "a", name: "A", template: "blank", role: "owner" })
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
})
