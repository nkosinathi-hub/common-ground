import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CommentsService } from "../application/comments-service"
import { MEMBERS, PARENT, SPACE, threadGateway } from "../testing/render-thread"
import CommentThread from "./CommentThread.svelte"
import { commentsContext } from "./context"

function setup(isOwner = false, gateway = threadGateway()) {
  const context = commentsContext({ service: new CommentsService(gateway) })
  const props = { spaceId: SPACE, parent: PARENT, me: "me", isOwner, members: MEMBERS }
  return { gateway, view: render(CommentThread, { props, context }) }
}
const textbox = () => screen.getByLabelText("Add a comment")
const write = (value: string) => fireEvent.input(textbox(), { target: { value } })
const post = () => fireEvent.click(screen.getByRole("button", { name: "Post" }))

afterEach(cleanup)

describe("CommentThread", () => {
  it("lists comments with author names and posts plain text without rendering markup", async () => {
    const { gateway, view } = setup()
    expect(await screen.findByText("Comment 1")).toBeInTheDocument()
    expect(screen.getByRole("article", { name: "Comment by Zola" })).toBeInTheDocument()
    await write("<b>bold</b> & <img src=x onerror=alert(1)>")
    await post()
    expect(
      await screen.findByText("<b>bold</b> & <img src=x onerror=alert(1)>"),
    ).toBeInTheDocument()
    expect(view.container.querySelector("b, img")).toBeNull()
    expect(gateway.rows).toHaveLength(2)
    await waitFor(() => expect((textbox() as HTMLTextAreaElement).value).toBe(""))
  })

  it("mentions members chosen from the picker, stored as ids and shown as names", async () => {
    const { gateway } = setup()
    await screen.findByText("Comment 1")
    await fireEvent.keyDown(textbox(), { key: "@" })
    const picker = screen.getByRole("group", { name: "Mention a member" })
    expect(within(picker).queryByRole("button", { name: "Nkosi" })).toBeNull()
    await fireEvent.input(within(picker).getByLabelText("Find a member"), {
      target: { value: "zo" },
    })
    await fireEvent.click(within(picker).getByRole("button", { name: "Zola" }))
    expect(screen.getByRole("list", { name: "Mentioning" })).toHaveTextContent("@Zola")
    await fireEvent.click(screen.getByRole("button", { name: "Mention" }))
    await fireEvent.click(screen.getByRole("button", { name: "Anele" }))
    await fireEvent.click(screen.getByRole("button", { name: "Do not mention Anele" }))
    await write("You will love this")
    await post()
    expect(await screen.findByText("Mentioned Zola")).toBeInTheDocument()
    expect(gateway.rows.at(-1)).toMatchObject({ body: "You will love this", mentionIds: ["zola"] })
  })

  it("blurs spoilers until revealed", async () => {
    const { view } = setup()
    await screen.findByText("Comment 1")
    await write("The twist")
    await fireEvent.click(screen.getByLabelText("Contains spoilers"))
    await post()
    await screen.findByRole("button", { name: "Show spoiler" })
    expect(view.container.querySelector("[data-concealed]")).toHaveClass("blur-sm")
    await fireEvent.click(screen.getByRole("button", { name: "Show spoiler" }))
    expect(view.container.querySelector("[data-concealed]")).toBeNull()
    expect(screen.getByText("The twist")).toBeInTheDocument()
  })

  it("shows a validation error and keeps the draft", async () => {
    setup()
    await screen.findByText("Comment 1")
    await write("   ")
    await post()
    expect(await screen.findByRole("alert")).toHaveTextContent(/write something/i)
  })

  it("loads older comments above the newest page", async () => {
    const gateway = threadGateway()
    gateway.seed(SPACE, PARENT, 2, "anele")
    setup(false, gateway)
    await screen.findByText("Comment 3")
    expect(screen.queryByText("Comment 1")).toBeNull()
    await fireEvent.click(screen.getByRole("button", { name: "Load older comments" }))
    const items = await screen.findAllByRole("article")
    expect(items[0]).toHaveTextContent("Comment 1")
    expect(screen.queryByRole("button", { name: "Load older comments" })).toBeNull()
  })

  it("shows an empty state and an error with retry", async () => {
    const gateway = threadGateway()
    gateway.rows = []
    gateway.failWith = { kind: "network", message: "Offline" }
    setup(false, gateway)
    await fireEvent.click(await screen.findByRole("button", { name: /try again/i }))
    gateway.failWith = null
    await fireEvent.click(await screen.findByRole("button", { name: /try again/i }))
    expect(await screen.findByText("No comments yet")).toBeInTheDocument()
  })
})
