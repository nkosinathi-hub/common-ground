import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseIdeas } from "./supabase-ideas"

describe("SupabaseIdeas.inProgress", () => {
  it("asks for the in-progress stages, most recently changed first, a few at a time", async () => {
    const { calls, client } = recordingClient({ data: [], error: null })
    const result = await new SupabaseIdeas(client as Db).inProgress("s1", 5)
    expect(result).toEqual({ ok: true, value: [] })
    expect(calls).toContainEqual(["eq", "space_id", "s1"])
    expect(calls).toContainEqual(["in", "stage", ["exploring", "planning", "building"]])
    expect(calls).toContainEqual(["order", "updated_at", { ascending: false }])
    expect(calls.at(-1)).toEqual(["limit", 5])
  })
})
