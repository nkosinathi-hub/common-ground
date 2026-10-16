import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { appError, err } from "@/shared/domain"
import { IdeasService } from "../application/ideas-service"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { ideasContext } from "./context"
import IdeaHeader from "./IdeaHeader.svelte"

const AUTHOR = { me: "u1", isOwner: false }

async function setup(viewer = AUTHOR) {
  const repo = new InMemoryIdeas()
  const service = new IdeasService(repo)
  const created = await service.capture({ spaceId: "s", title: "Tea bar" })
  if (!created.ok) throw new Error("capture failed")
  const idea = { ...created.value, createdBy: "u1" }
  const onDeleted = vi.fn()
  const props = { idea, viewer, onChange: vi.fn(), onDeleted }
  render(IdeaHeader, { props, context: ideasContext(service) })
  return { repo, idea, onDeleted }
}

async function confirmDelete() {
  await fireEvent.click(screen.getByRole("button", { name: "Delete idea" }))
  const dialog = await screen.findByRole("alertdialog")
  await fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))
}

afterEach(cleanup)

describe("IdeaHeader heading", () => {
  it("names the page with the idea title for screen readers", async () => {
    await setup()
    expect(screen.getByRole("heading", { level: 1, name: "Tea bar" })).toBeInTheDocument()
  })
})

describe("IdeaHeader delete", () => {
  it("deletes the idea after confirming and hands control back", async () => {
    const { repo, idea, onDeleted } = await setup()
    await confirmDelete()
    await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce())
    expect(repo.rows.has(idea.id)).toBe(false)
  })

  it("offers delete only to the author or the space owner", async () => {
    await setup({ me: "u2", isOwner: false })
    expect(screen.queryByRole("button", { name: "Delete idea" })).toBeNull()
    cleanup()
    await setup({ me: "u2", isOwner: true })
    expect(screen.getByRole("button", { name: "Delete idea" })).toBeInTheDocument()
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
