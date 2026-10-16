import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { ENTRY_COLUMNS, SupabaseBudget } from "./supabase-budget"

const row = {
  id: "b1",
  idea_id: "i1",
  category: "Rent",
  label: "Deposit",
  estimated_minor: 150000,
  actual_minor: 0,
  created_by: "u1",
  created_at: "2026-10-15T10:00:00Z",
  updated_at: "2026-10-15T10:00:00.123456+00:00",
}
const values = { category: "Rent", label: "Bond", estimatedMinor: 150000, actualMinor: 1000 }
const columns = { category: "Rent", label: "Bond", estimated_minor: 150000, actual_minor: 1000 }

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, budget: new SupabaseBudget(client as Db) }
}

describe("SupabaseBudget", () => {
  it("lists every line of an idea by category, oldest first", async () => {
    const { calls, budget } = setup({ data: [row], error: null })
    expect(await budget.list("i1")).toMatchObject({
      ok: true,
      value: [{ id: "b1", estimatedMinor: 150000, createdBy: "u1", updatedAt: row.updated_at }],
    })
    expect(calls).toEqual([
      ["from", "budget_entries"],
      ["select", ENTRY_COLUMNS],
      ["eq", "idea_id", "i1"],
      ["order", "category"],
      ["order", "created_at"],
    ])
  })

  it("adds a line under its space and idea in minor units", async () => {
    const { calls, budget } = setup({ data: row, error: null })
    expect((await budget.add("s1", "i1", values)).ok).toBe(true)
    expect(calls[1]).toEqual(["insert", { space_id: "s1", idea_id: "i1", ...columns }])
  })

  it("updates only while updated_at is still the one the client saw", async () => {
    const { calls, budget } = setup({ data: [{ ...row, label: "Bond" }], error: null })
    const updated = await budget.update("b1", row.updated_at, values)
    expect(updated).toMatchObject({ ok: true, value: { label: "Bond" } })
    expect(calls.slice(1)).toEqual([
      ["update", columns],
      ["eq", "id", "b1"],
      ["eq", "updated_at", row.updated_at],
      ["select", ENTRY_COLUMNS],
    ])
  })

  it("reads no row back from an update as a conflict", async () => {
    const stale = await setup({ data: [], error: null }).budget.update("b1", "old", values)
    expect(stale.ok ? null : stale.error.kind).toBe("conflict")
  })

  it("changes the currency through the server function", async () => {
    const { calls, budget } = setup({ data: null, error: null })
    expect(await budget.changeCurrency("i1", "USD", true)).toEqual({ ok: true, value: undefined })
    expect(calls).toEqual([
      ["rpc", "change_idea_currency", { idea: "i1", new_currency: "USD", clear_entries: true }],
    ])
  })

  it("deletes by id and passes errors through", async () => {
    expect((await setup({ data: [{ id: "b1" }], error: null }).budget.remove("b1")).ok).toBe(true)
    expect((await setup({ data: null, error: { message: "down" } }).budget.list("i1")).ok).toBe(
      false,
    )
  })
})
