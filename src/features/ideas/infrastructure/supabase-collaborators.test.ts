import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { COLLABORATOR_COLUMNS } from "./idea-row"
import { SupabaseCollaborators } from "./supabase-collaborators"

const row = {
  user_id: "u2",
  invited_by: "u1",
  invited_at: "2026-10-16T09:00:00Z",
  accepted_at: null,
}

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, people: new SupabaseCollaborators(client as Db) }
}

describe("SupabaseCollaborators", () => {
  it("lists an idea's invites, oldest first", async () => {
    const { calls, people } = setup({ data: [row], error: null })
    expect(await people.list("i1")).toEqual({
      ok: true,
      value: [{ userId: "u2", invitedBy: "u1", invitedAt: row.invited_at, acceptedAt: null }],
    })
    expect(calls).toEqual([
      ["from", "idea_collaborators"],
      ["select", COLLABORATOR_COLUMNS],
      ["eq", "idea_id", "i1"],
      ["order", "invited_at"],
    ])
  })

  it("invites, answers and removes through the RPCs", async () => {
    const { calls, people } = setup({ data: null, error: null })
    expect(await people.invite("i1", "u2")).toEqual({ ok: true, value: undefined })
    await people.respond("i1", true)
    await people.remove("i1", "u2")
    expect(calls).toEqual([
      ["rpc", "invite_idea_collaborator", { idea: "i1", member: "u2" }],
      ["rpc", "respond_idea_invite", { idea: "i1", accept: true }],
      ["rpc", "remove_idea_collaborator", { idea: "i1", member: "u2" }],
    ])
  })

  it("passes a refusal through", async () => {
    const { people } = setup({ data: null, error: { code: "42501", message: "no" } })
    expect(await people.invite("i1", "u2")).toMatchObject({ ok: false, error: { kind: "denied" } })
  })
})
