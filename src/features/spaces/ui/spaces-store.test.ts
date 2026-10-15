import { describe, expect, it } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { SpacesService } from "../application/spaces-service"
import { FakeSpacesGateway, MemoryActiveSpace } from "../testing/fake-spaces"
import { SpacesStore } from "./spaces.svelte"

const setup = () => {
  const gateway = new FakeSpacesGateway()
  const active = new MemoryActiveSpace()
  const service = new SpacesService(
    gateway,
    active,
    { reauthenticate: async () => ok(undefined) },
    "x/",
  )
  return { gateway, active, store: new SpacesStore(service) }
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

  it("reports load failures", async () => {
    const { gateway, store } = setup()
    Object.assign(gateway, { listMine: async () => err(appError("network", "down")) })
    await store.refresh()
    expect(store.status).toBe("error")
  })
})
