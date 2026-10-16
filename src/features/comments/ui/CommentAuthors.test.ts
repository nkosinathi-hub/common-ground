import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { FORMER_MEMBER } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { CommentsService } from "../application/comments-service"
import { MEMBERS, PARENT, SPACE, threadGateway } from "../testing/render-thread"
import CommentThread from "./CommentThread.svelte"
import { provideComments } from "./context"

// Zola wrote the seeded comment and has since been removed from the space.
const current = MEMBERS.filter((member) => member.id !== "zola")

function show(authors: typeof MEMBERS) {
  const provide = () => provideComments({ service: new CommentsService(threadGateway()) })
  const props = {
    spaceId: SPACE,
    parent: PARENT,
    me: "me",
    isOwner: false,
    members: current,
    authors,
  }
  render(Provided, { props: { provide, component: CommentThread, props } })
}

afterEach(cleanup)

describe("comment authors", () => {
  it("keep a removed member's name while their profile is still visible", async () => {
    show(MEMBERS)
    expect(await screen.findByRole("article", { name: "Comment by Zola" })).toBeInTheDocument()
  })

  it("read Former member once the profile is gone", async () => {
    show(current)
    const name = `Comment by ${FORMER_MEMBER}`
    expect(await screen.findByRole("article", { name })).toBeInTheDocument()
  })
})
