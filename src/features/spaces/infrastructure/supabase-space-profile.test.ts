import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseSpaceProfile } from "./supabase-space-profile"

const setup = (replies: Reply[]) => {
  const { client, calls } = recordingClient(replies)
  return { profile: new SupabaseSpaceProfile(client as Db), calls }
}

describe("SupabaseSpaceProfile", () => {
  it("updates only the named columns and confirms a row changed", async () => {
    const { profile, calls } = setup([{ data: [{ id: "s1" }], error: null }])
    expect(await profile.updateProfile("s1", { tagline: "Hi", accent: null })).toEqual({
      ok: true,
      value: undefined,
    })
    expect(calls).toEqual([
      ["from", "spaces"],
      ["update", { tagline: "Hi", accent_color: null }],
      ["eq", "id", "s1"],
      ["select", "id"],
    ])
  })

  it("reports an update that RLS silently refused as denied, not saved", async () => {
    const { profile } = setup([{ data: [], error: null }])
    expect(await profile.updateProfile("s1", { name: "A" })).toMatchObject({
      ok: false,
      error: { kind: "denied" },
    })
  })

  it("sets a media slot through the RPC and returns the previous path", async () => {
    const { profile, calls } = setup([
      { data: "s1/avatar/old.webp", error: null },
      { data: null, error: null },
      { data: null, error: { code: "P0002", message: "upload the picture first" } },
    ])
    expect(await profile.setMedia("s1", "avatar", "s1/avatar/new.webp")).toEqual({
      ok: true,
      value: "s1/avatar/old.webp",
    })
    expect(calls[0]).toEqual([
      "rpc",
      "set_space_media",
      { target_space: "s1", slot: "avatar", object_path: "s1/avatar/new.webp" },
    ])
    expect(await profile.setMedia("s1", "cover", null)).toEqual({ ok: true, value: null })
    expect((await profile.setMedia("s1", "cover", "x")).ok).toBe(false)
  })
})
