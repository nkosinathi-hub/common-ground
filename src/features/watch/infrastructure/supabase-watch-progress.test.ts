import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseWatchProgress } from "./supabase-watch-progress"

const progressFor = (replies: Reply[]) => {
  const { client, calls } = recordingClient(replies)
  return { progress: new SupabaseWatchProgress(client as Db), calls }
}
const PROGRESS = {
  user_id: "u1",
  status: "watching",
  season: 1,
  episode: 3,
  completed_on: null,
  updated_at: "2026-10-15T10:00:00Z",
}

describe("SupabaseWatchProgress", () => {
  it("reads every member's progress, newest first, with who I am", async () => {
    const { progress, calls } = progressFor([{ data: [PROGRESS], error: null }])
    expect(await progress.progress("i1")).toMatchObject({
      ok: true,
      value: { me: "u1", entries: [{ userId: "u1", status: "watching", episode: 3 }] },
    })
    expect(calls).toContainEqual(["eq", "watch_item_id", "i1"])
    expect(calls).toContainEqual(["order", "updated_at", { ascending: false }])
  })

  it("reads the together pointer alongside, none before a watch party", async () => {
    const { progress } = progressFor([
      { data: [PROGRESS], error: null },
      { data: { season: 1, episode: 2 }, error: null },
    ])
    expect(await progress.progress("i1")).toMatchObject({
      ok: true,
      value: { together: { season: 1, episode: 2 } },
    })
    const none = progressFor([
      { data: [], error: null },
      { data: null, error: null },
    ])
    expect(await none.progress.progress("i1")).toMatchObject({
      ok: true,
      value: { together: null },
    })
  })

  it("saves my progress through the RPC with nulls for empty fields", async () => {
    const { progress, calls } = progressFor([{ data: null, error: null }])
    const input = { status: "completed", season: null, episode: null } as const
    const saved = await progress.saveProgress("i1", { ...input, completedOn: null })
    expect(saved).toEqual({ ok: true, value: undefined })
    expect(calls[0]).toEqual([
      "rpc",
      "save_watch_progress",
      expect.objectContaining({ item: "i1", new_status: "completed" }),
    ])
  })

  it("lists the latest nights and logs one, leaving an empty note out", async () => {
    const night = {
      id: "n1",
      watched_on: "2026-10-14",
      note: null,
      watch_session_members: [{ user_id: "u1" }, { user_id: "u2" }],
    }
    const { progress, calls } = progressFor([
      { data: [night], error: null },
      { data: "n2", error: null },
    ])
    expect(await progress.sessions("i1")).toMatchObject({
      ok: true,
      value: [{ id: "n1", watchedOn: "2026-10-14", memberIds: ["u1", "u2"] }],
    })
    expect(calls).toContainEqual(["limit", 50])
    const input = { watchedOn: "2026-10-15" as DateOnly, memberIds: ["u1"], note: "" }
    expect(await progress.logSession("i1", input)).toEqual({ ok: true, value: "n2" })
    expect(calls.at(-1)).toEqual([
      "rpc",
      "log_watch_session",
      { item: "i1", watched_on: "2026-10-15", member_ids: ["u1"], note: undefined },
    ])
  })
})
