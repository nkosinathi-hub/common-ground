import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { appError, err } from "@/shared/domain"
import { IdeasService } from "../application/ideas-service"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { ideasContext } from "./context"
import IdeaHeader from "./IdeaHeader.svelte"

async function setup() {
  const repo = new InMemoryIdeas()
  const service = new IdeasService(repo)
  const created = await service.capture({ spaceId: "s", title: "Tea bar" })
  if (!created.ok) throw new Error("capture failed")
  const onDeleted = vi.fn()
  const props = { idea: created.value, onChange: vi.fn(), onDeleted }
  render(IdeaHeader, { props, context: ideasContext(service) })
  return { repo, idea: created.value, onDeleted }
}

async function confirmDelete() {
  await fireEvent.click(screen.getByRole("button", { name: "Delete idea" }))
  const dialog = await screen.findByRole("alertdialog")
  await fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))
}

afterEach(cleanup)

describe("IdeaHeader delete", () => {
  it("deletes the idea after confirming and hands control back", async () => {
    const { repo, idea, onDeleted } = await setup()
    await confirmDelete()
    await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce())
    expect(repo.rows.has(idea.id)).toBe(false)
  })

  it("shows the server's refusal and stays on the idea", async () => {
    const { repo, idea, onDeleted } = await setup()
    const refusal = "Only its author or the space owner can delete this"
    repo.remove = async () => err(appError("denied", refusal))
    await confirmDelete()
    expect(await screen.findByRole("alert")).toHaveTextContent(refusal)
    expect(onDeleted).not.toHaveBeenCalled()
    expect(repo.rows.has(idea.id)).toBe(true)
  })
})
