import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { appError, err } from "@/shared/domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideIdeas } from "./context"
import IdeaHeader from "./IdeaHeader.svelte"

const AUTHOR = { me: "u1", isOwner: false }

async function setup(viewer = AUTHOR) {
  const { repo, service } = inMemoryIdeasService()
  const created = await service.capture({ spaceId: "s", title: "Tea bar" })
  if (!created.ok) throw new Error("capture failed")
  const idea = { ...created.value, createdBy: "u1" }
  const onDeleted = vi.fn()
  const props = {
    idea,
    viewer,
    members: [],
    authors: [],
    onChange: vi.fn(),
    onPeopleChanged: vi.fn(),
    onDeleted,
  }
  render(Provided, {
    props: { provide: () => provideIdeas({ service }), component: IdeaHeader, props },
  })
  return { repo, idea, onDeleted }
}

const openMenu = async () =>
  fireEvent.keyDown(screen.getByRole("button", { name: "More for Tea bar" }), { key: "Enter" })

async function confirmDelete() {
  await openMenu()
  await fireEvent.click(await screen.findByRole("menuitem", { name: "Delete idea" }))
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

describe("IdeaHeader details", () => {
  it("renames and retags from the details dialog", async () => {
    const { repo, idea } = await setup()
    await openMenu()
    await fireEvent.click(await screen.findByRole("menuitem", { name: "Edit details" }))
    const dialog = within(await screen.findByRole("dialog", { name: "Edit this idea" }))
    await fireEvent.input(dialog.getByLabelText("Title"), { target: { value: "Tea cart" } })
    await fireEvent.input(dialog.getByLabelText("Tags"), { target: { value: "food, pop-up" } })
    await fireEvent.click(dialog.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(repo.rows.get(idea.id)?.title).toBe("Tea cart"))
    expect(repo.rows.get(idea.id)?.tags).toEqual(["food", "pop-up"])
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
    await openMenu()
    expect(await screen.findByRole("menuitem", { name: "Edit details" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Delete idea" })).toBeNull()
    cleanup()
    await setup({ me: "u2", isOwner: true })
    await openMenu()
    expect(await screen.findByRole("menuitem", { name: "Delete idea" })).toBeInTheDocument()
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
