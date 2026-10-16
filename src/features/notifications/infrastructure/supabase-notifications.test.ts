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

describe("SupabaseNotifications unread count", () => {
  it("counts every unread notification on the server without fetching rows", async () => {
    const reply = { data: null, error: null, count: 61 }
    const { client: db, calls } = recordingClient([reply])
    expect(await new SupabaseNotifications(db as Db).unreadCount()).toEqual({ ok: true, value: 61 })
    expect(calls).toEqual([
      ["from", "notifications"],
      ["select", "id", { count: "exact", head: true }],
      ["is", "read_at", null],
    ])
  })
})

describe("SupabaseActivity", () => {
  it("lists one space's events, with who did it and who a private one was with", async () => {
    const row = {
      id: "e1",
      event_type: "member_joined",
      subject_type: "profile",
      subject_id: "u",
      created_at: "2026-10-15T10:00:00Z",
      actor: { display_name: "Ben" },
    }
    const shared = { ...row, id: "e2", by_me: true, target: { display_name: "Ana" } }
    const { client: db, calls } = recordingClient([{ data: [row, shared], error: null }])
    const page = await new SupabaseActivity(db as Db).list("s", null)
    expect(page).toMatchObject({
      ok: true,
      value: {
        items: [
          { id: "e1", actorName: "Ben", byMe: false, targetName: null },
          { id: "e2", byMe: true, targetName: "Ana" },
        ],
      },
    })
    expect(calls).toContainEqual(["eq", "space_id", "s"])
    expect(calls.at(-1)).toEqual(["limit", PAGE_SIZE])
  })

  it("lists only the latest few when given a size", async () => {
    const { client: db, calls } = recordingClient([{ data: [], error: null }])
    await new SupabaseActivity(db as Db).list("s", null, 6)
    expect(calls.at(-1)).toEqual(["limit", 6])
  })
})
