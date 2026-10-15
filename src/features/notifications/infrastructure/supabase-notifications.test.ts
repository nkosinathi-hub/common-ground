import { describe, expect, it } from "vitest"
import { PAGE_SIZE } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseActivity, SupabaseNotifications } from "./supabase-notifications"

const noteRow = (id: string, actor: { display_name: string } | null) => ({
  id,
  space_id: "s",
  type: "mention",
  subject_type: "idea",
  subject_id: "i",
  read_at: null,
  created_at: "2026-10-15T10:00:00Z",
  actor,
})

describe("SupabaseNotifications", () => {
  it("maps rows newest first with actor names, former members as null", async () => {
    const { client: db, calls } = recordingClient([
      { data: [noteRow("n1", { display_name: "Ana" }), noteRow("n2", null)], error: null },
    ])
    const page = await new SupabaseNotifications(db as Db).list(null)
    expect(page.ok && page.value.items.map((n) => [n.id, n.actorName])).toEqual([
      ["n1", "Ana"],
      ["n2", null],
    ])
    expect(page.ok && page.value.next).toBeNull()
    expect(calls).toContainEqual(["order", "created_at", { ascending: false }])
    expect(calls).toContainEqual(["limit", PAGE_SIZE])
  })

  it("pages older than the cursor with the quoted keyset filter", async () => {
    const { client: db, calls } = recordingClient([{ data: [], error: null }])
    await new SupabaseNotifications(db as Db).list({ createdAt: "2026-10-15T10:00:00Z", id: "n1" })
    expect(calls).toContainEqual([
      "or",
      'created_at.lt."2026-10-15T10:00:00Z",and(created_at.eq."2026-10-15T10:00:00Z",id.lt.n1)',
    ])
  })

  it("stamps reads with the time it is given", async () => {
    const { client: db, calls } = recordingClient([
      { data: null, error: null },
      { data: null, error: { code: "42501" } },
    ])
    const gateway = new SupabaseNotifications(db as Db)
    expect((await gateway.markRead(["n1"], "T")).ok).toBe(true)
    expect(calls).toContainEqual(["update", { read_at: "T" }])
    expect(calls).toContainEqual(["in", "id", ["n1"]])
    expect(await gateway.markAllRead("T")).toMatchObject({ error: { kind: "denied" } })
    expect(calls).toContainEqual(["is", "read_at", null])
  })
})

describe("SupabaseActivity", () => {
  it("lists one space's events", async () => {
    const row = {
      id: "e1",
      event_type: "member_joined",
      subject_type: "profile",
      subject_id: "u",
      created_at: "2026-10-15T10:00:00Z",
      actor: { display_name: "Ben" },
    }
    const { client: db, calls } = recordingClient([{ data: [row], error: null }])
    const page = await new SupabaseActivity(db as Db).list("s", null)
    expect(page).toMatchObject({ ok: true, value: { items: [{ id: "e1", actorName: "Ben" }] } })
    expect(calls).toContainEqual(["eq", "space_id", "s"])
  })
})
