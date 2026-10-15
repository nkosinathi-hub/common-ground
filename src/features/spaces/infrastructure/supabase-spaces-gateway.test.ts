import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseSpacesGateway } from "./supabase-spaces-gateway"

const gatewayFor = (replies: Reply[], userId?: string | null) => {
  const { client: db, calls } = recordingClient(replies, userId)
  return { gateway: new SupabaseSpacesGateway(db as Db), calls }
}

describe("SupabaseSpacesGateway", () => {
  it("lists the signed-in user's memberships as spaces", async () => {
    const row = { role: "owner", spaces: { id: "s1", name: "Us", template: "couple" } }
    const { gateway, calls } = gatewayFor([{ data: [row], error: null }])
    expect(await gateway.listMine()).toEqual({
      ok: true,
      value: [{ id: "s1", name: "Us", template: "couple", role: "owner" }],
    })
    expect(calls).toContainEqual(["eq", "user_id", "u1"])
  })

  it("never queries with an empty user id when signed out", async () => {
    const { gateway, calls } = gatewayFor([], null)
    expect(await gateway.listMine()).toMatchObject({ error: { kind: "unauthenticated" } })
    expect(calls).toEqual([])
  })

  it("maps members with their display names", async () => {
    const row = { user_id: "u2", role: "member", joined_at: "t", profiles: { display_name: "Ana" } }
    const { gateway } = gatewayFor([{ data: [row], error: null }])
    expect(await gateway.members("s1")).toEqual({
      ok: true,
      value: [{ userId: "u2", role: "member", joinedAt: "t", displayName: "Ana" }],
    })
  })

  it("returns invite records untouched by time", async () => {
    const row = {
      id: "i1",
      created_at: "c",
      expires_at: "e",
      redeemed_at: null,
      revoked_at: "r",
    }
    const { gateway } = gatewayFor([{ data: [row], error: null }])
    expect(await gateway.invites("s1")).toEqual({
      ok: true,
      value: [{ id: "i1", createdAt: "c", expiresAt: "e", redeemedAt: null, revokedAt: "r" }],
    })
  })

  it("reads an empty or unknown preview as an invalid invite", async () => {
    const { gateway } = gatewayFor([{ data: [], error: null }])
    expect(await gateway.previewInvite("t")).toEqual({
      ok: true,
      value: { spaceName: null, inviterName: null, status: "invalid" },
    })
  })

  it("passes RPC results and errors through", async () => {
    const { gateway, calls } = gatewayFor([
      { data: "s9", error: null },
      { data: null, error: { code: "42501", message: "no" } },
    ])
    expect(await gateway.create("Us", "blank")).toEqual({ ok: true, value: "s9" })
    expect(calls[0]).toEqual(["rpc", "create_space", { space_name: "Us", space_template: "blank" }])
    expect(await gateway.leave("s9")).toMatchObject({ ok: false, error: { kind: "denied" } })
  })
})
