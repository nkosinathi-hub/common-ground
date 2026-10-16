import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { BudgetService } from "../application/budget-service"
import { InMemoryBudget } from "../testing/in-memory-budget"
import BudgetPanel from "./BudgetPanel.svelte"
import { budgetContext } from "./context"

const place = { spaceId: "s", ideaId: "i", currency: "ZAR" }
const form = { category: "Rent", label: "Deposit", estimated: "1500", actual: "" }

async function setup(canDelete = (_createdBy: string | null) => true) {
  const repo = new InMemoryBudget()
  repo.author = "ana"
  const service = new BudgetService(repo)
  const added = await service.add(place, form)
  if (!added.ok) throw new Error("add failed")
  const props = { ...place, canDelete, onCurrencyChanged: () => {} }
  render(BudgetPanel, { props, context: budgetContext({ service }) })
  return { service, base: added.value }
}

afterEach(cleanup)

describe("BudgetPanel", () => {
  it("edits a line in place", async () => {
    await setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Edit Deposit" }))
    const row = within(screen.getByRole("row", { name: "Edit Deposit" }))
    await fireEvent.input(row.getByRole("textbox", { name: "Item" }), { target: { value: "Bond" } })
    await fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Bond")).toBeInTheDocument()
  })

  it("shows the conflict copy and someone else's version after a lost race", async () => {
    const { service, base } = await setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Edit Deposit" }))
    await service.update(base, { ...form, label: "Theirs" }, "ZAR")
    await fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Someone else changed this. Reload to see their version",
    )
    expect(await screen.findByText("Theirs")).toBeInTheDocument()
  })

  it("offers delete only for lines the viewer may delete", async () => {
    await setup((createdBy) => createdBy === "ben")
    await screen.findByText("Deposit")
    expect(screen.queryByRole("button", { name: "Delete Deposit" })).toBeNull()
    cleanup()
    await setup((createdBy) => createdBy === "ana")
    expect(await screen.findByRole("button", { name: "Delete Deposit" })).toBeInTheDocument()
  })
})
