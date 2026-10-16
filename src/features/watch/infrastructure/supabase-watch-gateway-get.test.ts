import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { WATCH_ROW as row } from "../testing/watch-row"
import { SupabaseWatchGateway } from "./supabase-watch-gateway"

const getWith = (owner: Reply, mine: Reply) => {
  const { client } = recordingClient([{ data: [row], error: null }, owner, mine])
  return new SupabaseWatchGateway(client as Db).get("s1", "i1")
}
const OUTAGE = { data: null, error: { code: "", message: "FetchError: failed" } }

describe("SupabaseWatchGateway.get", () => {
  it("lets the author delete, and reads their own progress status", async () => {
    const view = await getWith(
      { data: false, error: null },
      { data: [{ status: "completed" }], error: null },
    )
    expect(view).toMatchObject({
      ok: true,
      value: { item: { id: "i1", myStatus: "completed" }, canDelete: true },
    })
  })

  it("fails the view when the owner check fails, instead of hiding Delete", async () => {
    const view = await getWith(OUTAGE, { data: [], error: null })
    expect(view).toMatchObject({ ok: false, error: { kind: "network" } })
  })

  it("fails the view when the viewer's progress cannot be read", async () => {
    const view = await getWith({ data: true, error: null }, OUTAGE)
    expect(view).toMatchObject({ ok: false, error: { kind: "network" } })
  })
})
