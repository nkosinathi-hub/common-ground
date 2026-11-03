import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { SEARCH_LIMIT } from "../domain/search"
import { SOURCES, pattern, quoted } from "./search-sources"
import { SupabaseSearch } from "./supabase-search"

const signal = () => new AbortController().signal

describe("workspace search adapter", () => {
  it("scopes every source to the active space, bounds pages and forwards cancellation", async () => {
    const { client, calls } = recordingClient({ data: [], error: null })
    const abort = signal()
    const result = await new SupabaseSearch(client as Db, () => "me").search(
      "space",
      "a_%",
      2,
      abort,
    )
    expect(result).toEqual({ ok: true, value: { hits: [], unavailable: [], more: false } })
    expect(calls.filter(([method]) => method === "from").map(([, table]) => table)).toEqual(
      SOURCES.map((s) => s.table),
    )
    expect(
      calls.filter(([method]) => method === "filter").filter(([, col]) => col === "space_id"),
    ).toEqual(SOURCES.map(() => ["filter", "space_id", "eq", "space"]))
    expect(calls.filter(([method]) => method === "range")).toEqual(
      SOURCES.map(() => ["range", 2 * SEARCH_LIMIT, 3 * SEARCH_LIMIT - 1]),
    )
    expect(calls.filter(([method]) => method === "abortSignal")).toEqual(
      SOURCES.map(() => ["abortSignal", abort]),
    )
    expect(calls).toContainEqual(["filter", "spoiler", "eq", false])
    expect(calls).toContainEqual(["filter", "watch_items.watch_progress.user_id", "eq", "me"])
    expect(calls).toContainEqual(["filter", "status", "eq", "ready"])
    expect(
      calls.some(
        ([method, value]) => method === "or" && String(value).startsWith("expires_at.is.null,"),
      ),
    ).toBe(true)
    expect(calls).toContainEqual(["ilike", "body", "%a\\_\\%%"])
  })
  it("keeps text literal inside PostgREST filters", () => {
    expect(pattern('10%_\\ "')).toBe('%10\\%\\_\\\\ "%')
    expect(quoted('x",id.gt.0\\')).toBe('"x\\",id.gt.0\\\\"')
  })
  it("reports a failed source while keeping other results and pagination", async () => {
    const replies = SOURCES.map((source) =>
      source.kind === "watch"
        ? {
            data: Array.from({ length: SEARCH_LIMIT }, (_, n) => ({ id: `w${n}`, title: "Ted" })),
            error: null,
          }
        : source.kind === "note"
          ? { data: null, error: { message: "offline", code: "500" } }
          : { data: [], error: null },
    )
    const { client } = recordingClient(replies)
    const result = await new SupabaseSearch(client as Db, () => "me").search(
      "space",
      "Ted",
      0,
      signal(),
    )
    expect(result.ok && result.value.hits).toHaveLength(SEARCH_LIMIT)
    expect(result.ok && result.value.unavailable).toEqual(["note"])
    expect(result.ok && result.value.more).toBe(true)
  })
})
