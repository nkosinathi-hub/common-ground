import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CommentsService } from "../application/comments-service"
import { MEMBERS, PARENT, SPACE, threadGateway } from "../testing/render-thread"
import CommentThread from "./CommentThread.svelte"
import { provideComments } from "./context"
import Provided from "@/shared/ui/testing/Provided.svelte"

function setup(isOwner: boolean) {
  const gateway = threadGateway()
  gateway.seed(SPACE, PARENT, 1, "me")
  const provide = () => provideComments({ service: new CommentsService(gateway) })
  const props = { spaceId: SPACE, parent: PARENT, me: "me", isOwner, members: MEMBERS }
  render(Provided, { props: { provide, component: CommentThread, props } })
  return gateway
}
const article = (name: string) => screen.findByRole("article", { name })
/** Opens a comment's ⋯ menu and returns its items, or null when it has none. */
async function menu(author: string) {
  const more = screen.queryByRole("button", { name: `More for comment by ${author}` })
  if (!more) return null
  await fireEvent.keyDown(more, { key: "Enter" })
  return within(await screen.findByRole("menu"))
}

afterEach(cleanup)

describe("CommentThread moderation", () => {
  it("lets me edit my own comment and marks it edited", async () => {
    setup(false)
    const mine = await article("Comment by Nkosi")
    expect(await menu("Zola")).toBeNull()
    await fireEvent.click((await menu("Nkosi"))!.getByRole("menuitem", { name: "Edit" }))
    await fireEvent.input(within(mine).getByLabelText("Edit comment"), {
      target: { value: "Better words" },
    })
    await fireEvent.click(within(mine).getByRole("button", { name: "Save" }))
    expect(await within(mine).findByText("Better words")).toBeInTheDocument()
    expect(within(mine).getByText("(edited)")).toBeInTheDocument()
  })

  it("cancels an edit without saving", async () => {
    const gateway = setup(false)
    const mine = await article("Comment by Nkosi")
    await fireEvent.click((await menu("Nkosi"))!.getByRole("menuitem", { name: "Edit" }))
    await fireEvent.click(within(mine).getByRole("button", { name: "Cancel" }))
    expect(gateway.calls).toEqual([])
  })

  it("only offers delete on my own comments to members", async () => {
    setup(false)
    await article("Comment by Zola")
    expect(await menu("Zola")).toBeNull()
    const mine = await menu("Nkosi")
    expect(mine!.getByRole("menuitem", { name: "Delete comment" })).toBeInTheDocument()
  })

  it("lets the owner remove anyone's comment after confirming", async () => {
    const gateway = setup(true)
    await article("Comment by Zola")
    await fireEvent.click((await menu("Zola"))!.getByRole("menuitem", { name: "Delete comment" }))
    const dialog = await screen.findByRole("alertdialog")
    await fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(screen.queryByText("Comment 1")).toBeNull())
    expect(gateway.calls).toEqual(["remove:c1"])
  })
})
