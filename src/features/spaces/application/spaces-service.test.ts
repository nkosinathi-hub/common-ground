import { describe, expect, it } from "vitest"
import { PASSWORD, spacesSetup } from "../testing/spaces-setup"

describe("SpacesService", () => {
  it("creates a space, validates the name and makes it active", async () => {
    const { active, service } = spacesSetup()
    expect((await service.create("  ", "couple")).ok).toBe(false)
    const created = await service.create(" Us ", "couple")
    expect(created).toEqual({ ok: true, value: "space-1" })
    expect(active.value).toBe("space-1")
  })

  it("drops a remembered space the user no longer belongs to", async () => {
    const { active, gateway, service } = spacesSetup()
    gateway.spaces.push({ id: "a", name: "A", template: "blank", role: "member" })
    active.value = "gone"
    const loaded = await service.load()
    expect(loaded.ok && loaded.value.active?.id).toBe("a")
    expect(active.value).toBe("a")
  })

  it("issues invite links and joins through them once", async () => {
    const { active, service } = spacesSetup()
    await service.create("Us", "couple")
    const link = await service.createInviteLink("space-1")
    expect(link).toEqual({ ok: true, value: "https://x.io/cg/#/invite/token-1" })
    active.value = null
    expect((await service.redeemInvite("token-1")).ok).toBe(true)
    expect(active.value).toBe("space-1")
    expect((await service.redeemInvite("token-1")).ok).toBe(false)
  })

  it("clears the active space after leaving it", async () => {
    const { active, service } = spacesSetup()
    await service.create("Us", "blank")
    await service.leave("space-1")
    expect(active.value).toBeNull()
  })

  it("requires the password and exact name to delete", async () => {
    const { gateway, service } = spacesSetup()
    await service.create("Us", "blank")
    expect((await service.delete("space-1", "Us", "wrong")).ok).toBe(false)
    expect((await service.delete("space-1", "Them", PASSWORD)).ok).toBe(false)
    expect((await service.delete("space-1", "Us", PASSWORD)).ok).toBe(true)
    expect(gateway.spaces).toEqual([])
  })
})
