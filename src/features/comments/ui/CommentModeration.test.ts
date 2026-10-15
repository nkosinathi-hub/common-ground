import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CommentsService } from "../application/comments-service"
import { MEMBERS, PARENT, SPACE, threadGateway } from "../testing/render-thread"
import CommentThread from "./CommentThread.svelte"
import { commentsContext } from "./context"

function setup(isOwner: boolean) {
  const gateway = threadGateway()
  gateway.seed(SPACE, PARENT, 1, "me")
  const context = commentsContext({ service: new CommentsService(gateway) })
  const props = { spaceId: SPACE, parent: PARENT, me: "me", isOwner, members: MEMBERS }
  render(CommentThread, { props, context })
  return gateway
}
const article = (name: string) => screen.findByRole("article", { name })

afterEach(cleanup)

describe("CommentThread moderation", () => {
  it("lets me edit my own comment and marks it edited", async () => {
    setup(false)
    const mine = await article("Comment by Nkosi")
    expect(
      within(await article("Comment by Zola")).queryByRole("button", { name: "Edit" }),
    ).toBeNull()
    await fireEvent.click(within(mine).getByRole("button", { name: "Edit" }))
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
    await fireEvent.click(within(mine).getByRole("button", { name: "Edit" }))
    await fireEvent.click(within(mine).getByRole("button", { name: "Cancel" }))
    expect(gateway.calls).toEqual([])
  })

  it("only offers delete on my own comments to members", async () => {
    setup(false)
    expect(
      within(await article("Comment by Zola")).queryByRole("button", { name: "Delete comment" }),
    ).toBeNull()
    expect(
      within(await article("Comment by Nkosi")).getByRole("button", { name: "Delete comment" }),
    ).toBeInTheDocument()
  })

  it("lets the owner remove anyone's comment after confirming", async () => {
    const gateway = setup(true)
    const theirs = await article("Comment by Zola")
    await fireEvent.click(within(theirs).getByRole("button", { name: "Delete comment" }))
    const dialog = await screen.findByRole("alertdialog")
    await fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(screen.queryByText("Comment 1")).toBeNull())
    expect(gateway.calls).toEqual(["remove:c1"])
  })
})
