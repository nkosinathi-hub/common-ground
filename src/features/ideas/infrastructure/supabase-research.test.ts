import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { HYPOTHESIS_COLUMNS, LINK_COLUMNS, NOTE_COLUMNS } from "./research-rows"
import { SupabaseResearch } from "./supabase-research"

const base = { id: "r1", idea_id: "i1", created_by: "u1", created_at: "2026-10-15T10:00:00Z" }
const note = { ...base, body: "Call", created_by: null }
const link = { ...base, url: "https://x.dev", title: "X", description: "" }
const hypothesis = { ...base, statement: "Works", status: "untested" }

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, research: new SupabaseResearch(client as Db) }
}

describe("SupabaseResearch", () => {
  it("lists each collection by idea, newest first", async () => {
    for (const [name, table, columns, data] of [
      ["notes", "idea_notes", NOTE_COLUMNS, note],
      ["links", "research_links", LINK_COLUMNS, link],
      ["hypotheses", "hypotheses", HYPOTHESIS_COLUMNS, hypothesis],
    ] as const) {
      const { calls, research } = setup({ data: [data], error: null })
      const page = await research[name].list("i1", null)
      const author = data.created_by
      const items = [{ id: "r1", ideaId: "i1", createdBy: author }]
      expect(page).toMatchObject({ ok: true, value: { items } })
      expect(calls.slice(0, 3)).toEqual([
        ["from", table],
        ["select", columns],
        ["eq", "idea_id", "i1"],
      ])
      expect(calls.at(-1)).toEqual(["limit", 51])
    }
  })

  it("adds rows under their space and idea", async () => {
    const notes = setup({ data: note, error: null })
    expect(await notes.research.notes.add("s1", "i1", "Call")).toMatchObject({
      ok: true,
      value: { body: "Call" },
    })
    expect(notes.calls[1]).toEqual(["insert", { space_id: "s1", idea_id: "i1", body: "Call" }])
    const links = setup({ data: link, error: null })
    const input = { url: link.url, title: "X", description: "" }
    expect(await links.research.links.add("s1", "i1", input)).toMatchObject({
      ok: true,
      value: { url: link.url },
    })
    expect(links.calls[1]).toEqual(["insert", { space_id: "s1", idea_id: "i1", ...input }])
    const hypotheses = setup({ data: hypothesis, error: null })
    await hypotheses.research.hypotheses.add("s1", "i1", "Works")
    expect(hypotheses.calls[1]).toEqual([
      "insert",
      { space_id: "s1", idea_id: "i1", statement: "Works" },
    ])
  })

  it("updates only a hypothesis's status", async () => {
    const { calls, research } = setup({ data: { ...hypothesis, status: "validated" }, error: null })
    const updated = await research.hypotheses.setStatus("r1", "validated")
    expect(updated).toMatchObject({ ok: true, value: { status: "validated" } })
    expect(calls.slice(0, 3)).toEqual([
      ["from", "hypotheses"],
      ["update", { status: "validated" }],
      ["eq", "id", "r1"],
    ])
  })

  it("deletes by id and reads an RLS-filtered delete as refused", async () => {
    const done = setup({ data: [{ id: "r1" }], error: null })
    expect(await done.research.notes.remove("r1")).toEqual({ ok: true, value: undefined })
    expect(done.calls).toEqual([
      ["from", "idea_notes"],
      ["delete"],
      ["eq", "id", "r1"],
      ["select", "id"],
    ])
    const refused = setup({ data: [], error: null })
    expect(await refused.research.links.remove("r1")).toMatchObject({
      ok: false,
      error: { kind: "denied" },
    })
    expect(await refused.research.hypotheses.remove("r1")).toMatchObject({ ok: false })
  })
})
