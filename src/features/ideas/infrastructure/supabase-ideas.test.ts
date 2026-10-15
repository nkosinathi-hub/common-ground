import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { IDEA_COLUMNS, type IdeaRow } from "./idea-row"
import { SupabaseIdeas } from "./supabase-ideas"

const row: IdeaRow = {
  id: "i1",
  space_id: "s1",
  title: "Tea bar",
  stage: "inbox",
  tags: ["food"],
  template: "blank",
  brief: { pitch: "Hot tea" },
  currency: "ZAR",
  created_by: "u1",
  created_at: "2026-10-15T10:00:00Z",
  updated_at: "2026-10-15T10:00:01Z",
}

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, ideas: new SupabaseIdeas(client as Db) }
}

describe("SupabaseIdeas", () => {
  it("lists a space's ideas newest first, after the cursor", async () => {
    const { calls, ideas } = setup({ data: [row], error: null })
    const page = await ideas.list("s1", { createdAt: "2026-10-16T00:00:00Z", id: "i9" })
    expect(page).toMatchObject({ ok: true, value: { items: [{ id: "i1", spaceId: "s1" }] } })
    expect(calls).toEqual([
      ["from", "ideas"],
      ["select", IDEA_COLUMNS],
      ["eq", "space_id", "s1"],
      [
        "or",
        'created_at.lt."2026-10-16T00:00:00Z",and(created_at.eq."2026-10-16T00:00:00Z",id.lt.i9)',
      ],
      ["order", "created_at", { ascending: false }],
      ["order", "id", { ascending: false }],
      ["limit", 50],
    ])
  })

  it("creates and updates through single-row selects, copying tags", async () => {
    const { calls, ideas } = setup({ data: row, error: null })
    const brief = { pitch: "Hot tea" }
    await ideas.create({ spaceId: "s1", title: "Tea bar", template: "blank", brief })
    expect(calls.slice(0, 2)).toEqual([
      ["from", "ideas"],
      ["insert", { space_id: "s1", title: "Tea bar", template: "blank", brief }],
    ])
    const updated = await ideas.update("i1", { tags: ["food"] })
    expect(updated).toMatchObject({ ok: true, value: { tags: ["food"], brief } })
    expect(calls).toContainEqual(["update", { tags: ["food"] }])
    expect(calls.at(-1)).toEqual(["single"])
  })

  it("saves the brief through the conflict-checking RPC", async () => {
    const { calls, ideas } = setup({ data: "2026-10-15T11:00:00Z", error: null })
    const saved = await ideas.updateBrief("i1", row.updated_at, { pitch: "Tea" })
    expect(saved).toEqual({ ok: true, value: "2026-10-15T11:00:00Z" })
    expect(calls).toEqual([
      [
        "rpc",
        "update_idea_brief",
        { idea: "i1", expected_updated_at: row.updated_at, brief: { pitch: "Tea" } },
      ],
    ])
  })

  it("maps a stale brief to a conflict", async () => {
    const { ideas } = setup({ data: null, error: { code: "40001", message: "stale" } })
    const saved = await ideas.updateBrief("i1", "old", {})
    expect(saved).toMatchObject({ ok: false, error: { kind: "conflict" } })
  })

  it("reads a delete that RLS filtered out as refused", async () => {
    const { calls, ideas } = setup({ data: [], error: null })
    expect(await ideas.remove("i1")).toMatchObject({ ok: false, error: { kind: "denied" } })
    expect(calls).toEqual([["from", "ideas"], ["delete"], ["eq", "id", "i1"], ["select", "id"]])
    const get = setup({ data: row, error: null })
    expect(await get.ideas.get("i1")).toMatchObject({ ok: true, value: { title: "Tea bar" } })
  })
})
