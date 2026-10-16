import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { Result } from "@/shared/domain"
import type { Collaborator } from "../domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import { ideasContext } from "./context"
import IdeaDetail from "./IdeaDetail.svelte"

/** Ben started the idea and invited Ana; `me` is looking at it. */
async function setup(me: string, invite = ["ana"]) {
  const { repo, people, service } = inMemoryIdeasService()
  repo.author = "ben"
  const created = await service.capture({ spaceId: "s", title: "Zine" })
  if (!created.ok) throw new Error("capture failed")
  people.me = "ben"
  await service.invite(created.value.id, invite)
  people.me = me
  const viewer = { me, isOwner: false }
  const props = { spaceId: "s", ideaId: created.value.id, tab: "overview" as const, viewer }
  render(IdeaDetail, { props: { ...props, tabHref: () => "#" }, context: ideasContext(service) })
  await screen.findByText("Started by Ben")
  return { service, id: created.value.id }
}

const invited = (list: Result<Collaborator[]>) => (list.ok ? list.value.map((c) => c.userId) : [])

afterEach(cleanup)

describe("idea invitations", () => {
  it("lets the invitee accept, which makes it our idea", async () => {
    await setup("ana")
    const banner = screen.getByRole("region", { name: "Invitation" })
    expect(banner).toHaveTextContent("Ben invited you to work on this idea")
    expect(screen.queryByText("Our idea")).toBeNull()
    await fireEvent.click(within(banner).getByRole("button", { name: "Accept" }))
    expect(await screen.findByText("Our idea")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Invitation" })).toBeNull()
    expect(screen.getByRole("img", { name: "On this idea: Ben, Ana" })).toBeInTheDocument()
  })

  it("lets the invitee decline", async () => {
    const { service, id } = await setup("ana")
    await fireEvent.click(screen.getByRole("button", { name: "Decline" }))
    await expect.poll(async () => invited(await service.collaborators(id))).toEqual([])
    expect(screen.queryByRole("region", { name: "Invitation" })).toBeNull()
  })
})

describe("people dialog", () => {
  it("locks the author, shows pending invites and invites who is picked", async () => {
    const { service, id } = await setup("ben")
    await fireEvent.click(screen.getByRole("button", { name: "People" }))
    const dialog = within(await screen.findByRole("dialog", { name: "People on this idea" }))
    const author = dialog.getByRole("checkbox", { name: "Ben (started it)" })
    expect(author).toBeChecked()
    expect(author).toBeDisabled()
    expect(dialog.getByRole("checkbox", { name: "Ana (invited)" })).toBeChecked()
    await fireEvent.click(dialog.getByRole("checkbox", { name: "Cy" }))
    await fireEvent.click(dialog.getByRole("checkbox", { name: "Ana (invited)" }))
    await fireEvent.click(dialog.getByRole("button", { name: "Save" }))
    await expect.poll(async () => invited(await service.collaborators(id))).toEqual(["cy"])
  })
})
