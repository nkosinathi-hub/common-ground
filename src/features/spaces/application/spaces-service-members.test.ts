import { describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import { FakeSpacesGateway, MemoryActiveSpace } from "../testing/fake-spaces"
import { SpacesService } from "./spaces-service"

const setup = () => {
  const gateway = new FakeSpacesGateway()
  const service = new SpacesService(
    gateway,
    new MemoryActiveSpace(),
    { reauthenticate: async () => ok(undefined) },
    "x/",
  )
  return { gateway, service }
}

describe("SpacesService membership operations", () => {
  it("delegates member management to the gateway", async () => {
    const { gateway, service } = setup()
    await service.removeMember("s", "u1")
    await service.transferOwnership("s", "u2")
    expect(gateway.calls).toEqual(["remove:u1", "transfer:u2"])
    expect((await service.members("s")).ok).toBe(true)
    expect((await service.invites("s")).ok).toBe(true)
    expect((await service.revokeInvite("i")).ok).toBe(true)
  })

  it("renames with validation and previews invites", async () => {
    const { gateway, service } = setup()
    await service.create("Us", "blank")
    expect((await service.rename("space-1", "", "blank")).ok).toBe(false)
    expect((await service.rename("space-1", "Us two", "couple")).ok).toBe(true)
    expect(gateway.spaces[0]?.name).toBe("Us two")
    expect(await service.previewInvite("nope")).toMatchObject({
      ok: true,
      value: { status: "invalid" },
    })
    service.select("space-1")
    service.forget()
  })
})
