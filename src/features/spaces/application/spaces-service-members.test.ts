import { describe, expect, it } from "vitest"
import { spacesSetup } from "../testing/spaces-setup"

const record = (id: string, extra: object = {}) => ({
  id,
  createdAt: "2026-10-10T00:00:00Z",
  expiresAt: "2026-10-17T00:00:00Z",
  redeemedAt: null,
  revokedAt: null,
  ...extra,
})

describe("SpacesService membership operations", () => {
  it("delegates member management to the gateway", async () => {
    const { gateway, service } = spacesSetup()
    await service.removeMember("s", "u1")
    await service.transferOwnership("s", "u2")
    expect(gateway.calls).toEqual(["remove:u1", "transfer:u2"])
    expect((await service.members("s")).ok).toBe(true)
    expect((await service.revokeInvite("i")).ok).toBe(true)
  })

  it("derives each invite's status with the injected clock", async () => {
    const { gateway, service } = spacesSetup()
    gateway.inviteList = [
      record("open"),
      record("old", { expiresAt: "2026-10-15T11:59:59Z" }),
      record("used", { redeemedAt: "2026-10-11T00:00:00Z" }),
    ]
    const invites = await service.invites("s")
    expect(invites.ok && invites.value.map((i) => [i.id, i.status])).toEqual([
      ["open", "open"],
      ["old", "expired"],
      ["used", "used"],
    ])
  })

  it("previews invites", async () => {
    const { service } = spacesSetup()
    expect(await service.previewInvite("nope")).toMatchObject({
      ok: true,
      value: { status: "invalid" },
    })
  })
})
