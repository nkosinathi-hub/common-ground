import { describe, expect, it } from "vitest"
import { settleAdd, toItem, toWatchError, type WatchItemRow } from "./watch-rows"

const row: WatchItemRow = {
  id: "i1",
  space_id: "s1",
  catalog_type: null,
  catalog_id: null,
  title: "Home video",
  media_type: "movie",
  release_year: null,
  synopsis: "",
  poster_path: null,
  shared_intent: "want_to_watch",
  manual_availability_note: null,
  created_by: null,
  created_at: "2026-10-15T10:00:00Z",
}

describe("watch rows", () => {
  it("maps both duplicate signals to one friendly conflict", () => {
    expect(toWatchError({ code: "23505", message: "dup key" })).toEqual({
      kind: "conflict",
      message: "Already on your list",
    })
    expect(toWatchError({ code: "P0001", message: "Already on your list" }).kind).toBe("conflict")
    expect(toWatchError({ code: "42501" }).kind).toBe("denied")
  })

  it("reads a duplicate add as a conflict and passes other results through", async () => {
    const duplicate = Promise.resolve({ data: null, error: { code: "23505" } })
    expect(await settleAdd(duplicate, () => "")).toMatchObject({ error: { kind: "conflict" } })
    const added = Promise.resolve({ data: { id: "i9" }, error: null })
    expect(await settleAdd(added, (created) => created.id)).toEqual({ ok: true, value: "i9" })
  })

  it("maps a manual title and reads unknown progress text as not started", () => {
    expect(toItem(row)).toMatchObject({ catalog: null, myStatus: "not_started" })
    expect(toItem({ ...row, my_progress: "watching" }).myStatus).toBe("watching")
    expect(toItem({ ...row, my_progress: "rewatching" }).myStatus).toBe("not_started")
    expect(toItem(row, "completed").myStatus).toBe("completed")
  })

  it("carries everyone's place and the together pointer from the list, none for a single read", () => {
    const listed = toItem({
      ...row,
      places: [{ user_id: "u1", status: "watching", season: 1, episode: 2 }],
      together: { season: 1, episode: 1 },
    })
    expect(listed.places).toEqual([{ userId: "u1", status: "watching", season: 1, episode: 2 }])
    expect(listed.together).toEqual({ season: 1, episode: 1 })
    expect(toItem(row)).toMatchObject({ places: [], together: null })
  })
})
