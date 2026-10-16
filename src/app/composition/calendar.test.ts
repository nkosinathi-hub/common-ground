import { describe, expect, it } from "vitest"
import type { IdeasService } from "@/features/ideas"
import type { WatchService } from "@/features/watch"
import { ok } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { linkSearch } from "./calendar"

const watch = {
  list: async (_space: string, filters: { search: string }) =>
    ok({ items: [{ id: "w1", title: `Dune ${filters.search}` }], next: null }),
  togetherQueue: async () => ok([{ id: "w2", title: "Arrival" }]),
} as unknown as WatchService
const ideas = {
  list: async () =>
    ok({
      items: [
        { id: "i1", title: "Tea bar" },
        { id: "i2", title: "Garden" },
      ],
      next: null,
    }),
} as unknown as IdeasService

describe("calendar link search", () => {
  it("finds watch items through the watch service, by search", async () => {
    const search = linkSearch(recordingClient([]).client as Db, watch, ideas)
    expect(await search.search("s1", "watch_item", "du")).toEqual(
      ok([{ kind: "watch_item", id: "w1", label: "Dune du" }]),
    )
    expect(await search.watchNight("s1")).toEqual(
      ok([{ kind: "watch_item", id: "w2", label: "Arrival" }]),
    )
  })

  it("filters recent ideas by title, ignoring case", async () => {
    const search = linkSearch(recordingClient([]).client as Db, watch, ideas)
    expect(await search.search("s1", "idea", "TEA")).toEqual(
      ok([{ kind: "idea", id: "i1", label: "Tea bar" }]),
    )
  })

  it("searches the space's tasks by title with wildcards escaped", async () => {
    const { calls, client } = recordingClient({
      data: [{ id: "t1", title: "Book 100% the stall" }],
      error: null,
    })
    const result = await linkSearch(client as Db, watch, ideas).search("s1", "task", "100%")
    expect(result).toEqual(ok([{ kind: "task", id: "t1", label: "Book 100% the stall" }]))
    expect(calls).toEqual([
      ["from", "tasks"],
      ["select", "id, title"],
      ["eq", "space_id", "s1"],
      ["ilike", "title", "%100\\%%"],
      ["order", "title"],
      ["limit", 20],
    ])
  })
})
