import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { HOME_COLUMNS } from "./note-rows"
import { SupabaseHardTalk } from "./supabase-hard-talk"

const AT = "2026-10-16T09:00:00Z"
const row = {
  id: "n1",
  space_id: "s1",
  author_id: "ana",
  recipient_id: "ben",
  body: "",
  pinned: false,
  expires_at: null,
  created_at: AT,
  kind: "hard_talk",
  sections: { feel: "sad", other: "dropped", help: 3 },
  response_wish: "talk",
  support_wish: "listen",
  space_note_replies: [{ count: 0 }],
  space_note_reads: [],
  latest: [],
  responses: [{ kind: "time", created_at: AT }],
}

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, repo: new SupabaseHardTalk(client as Db) }
}

describe("SupabaseHardTalk", () => {
  it("lists notes shared with me, newest first, keeping only the known parts", async () => {
    const { calls, repo } = setup({ data: [row], error: null })
    expect(await repo.toMe("s1", "ben")).toMatchObject({
      ok: true,
      value: [
        {
          kind: "hard_talk",
          sections: { feel: "sad" },
          responseWish: "talk",
          supportWish: "listen",
          readAt: null,
          latestResponse: { kind: "time", at: AT },
        },
      ],
    })
    expect(calls.slice(0, 5)).toEqual([
      ["from", "space_notes"],
      ["select", HOME_COLUMNS],
      ["eq", "space_id", "s1"],
      ["eq", "kind", "hard_talk"],
      ["eq", "recipient_id", "ben"],
    ])
    expect(calls.at(-1)).toEqual(["limit", 20])
  })

  it("responds through respond_to_note, with or without a reminder", async () => {
    const { calls, repo } = setup({ data: { kind: "time", created_at: AT }, error: null })
    expect(await repo.respond("n1", "time", 3)).toEqual({
      ok: true,
      value: { kind: "time", createdAt: AT },
    })
    await repo.respond("n1", "here", null)
    expect(calls).toEqual([
      ["rpc", "respond_to_note", { note: "n1", kind: "time", remind_in_days: 3 }],
      ["rpc", "respond_to_note", { note: "n1", kind: "here", remind_in_days: null }],
    ])
  })
})
