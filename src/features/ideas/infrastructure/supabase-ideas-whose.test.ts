import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { IDEA_COLUMNS } from "./idea-row"
import { SupabaseIdeas } from "./supabase-ideas"

const setup = () => {
  const { calls, client } = recordingClient({ data: [], error: null })
  return { calls, ideas: new SupabaseIdeas(client as Db) }
}

describe("SupabaseIdeas whose filter", () => {
  it("embeds each idea's collaborators", () => {
    expect(IDEA_COLUMNS).toContain(
      "idea_collaborators(user_id, invited_by, invited_at, accepted_at)",
    )
  })

  it("keeps the viewer's own ideas on the server", async () => {
    const { calls, ideas } = setup()
    await ideas.list("s1", null, { whose: "mine", me: "u1" })
    expect(calls.slice(2, 4)).toEqual([
      ["eq", "space_id", "s1"],
      ["eq", "created_by", "u1"],
    ])
  })

  it("keeps every idea the viewer is on through the computed ours field", async () => {
    const { calls, ideas } = setup()
    await ideas.list("s1", null, { whose: "ours", me: "u1" })
    expect(calls[3]).toEqual(["is", "ours", true])
  })
})
