import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"

const setup = async () => {
  const fixture = inMemoryIdeasService()
  fixture.repo.author = "ana"
  const created = await fixture.service.capture({ spaceId: "s", title: "Zine" })
  if (!created.ok) throw new Error("capture failed")
  return { ...fixture, idea: created.value }
}

describe("IdeasService collaborators", () => {
  it("lists the space's members for the people picker", async () => {
    const { service } = await setup()
    const members = await service.members("s")
    expect(members.ok && members.value.map((m) => m.displayName)).toEqual(["Ana", "Ben", "Cy"])
  })

  it("invites several members, and they answer", async () => {
    const { service, people, idea } = await setup()
    expect(await service.invite(idea.id, ["ben", "cy"])).toEqual({ ok: true, value: undefined })
    people.me = "ben"
    await service.respond(idea.id, true)
    people.me = "cy"
    await service.respond(idea.id, false)
    const list = await service.collaborators(idea.id)
    expect(list.ok && list.value.map((c) => [c.userId, c.acceptedAt !== null])).toEqual([
      ["ben", true],
    ])
  })

  it("keeps inviting past a refusal and reports the first one", async () => {
    const { service, people, idea } = await setup()
    const invite = people.invite.bind(people)
    people.invite = async (ideaId, userId) =>
      userId === "ben"
        ? err(appError("denied", "only people on this idea can invite"))
        : invite(ideaId, userId)
    const result = await service.invite(idea.id, ["ben", "cy"])
    expect(result).toMatchObject({ ok: false, error: { kind: "denied" } })
    const list = await service.collaborators(idea.id)
    expect(list.ok && list.value.map((c) => c.userId)).toEqual(["cy"])
  })

  it("removes a collaborator", async () => {
    const { service, idea } = await setup()
    await service.invite(idea.id, ["ben"])
    expect((await service.removeCollaborator(idea.id, "ben")).ok).toBe(true)
    expect((await service.removeCollaborator(idea.id, "ben")).ok).toBe(false)
  })

  it("narrows the list to the viewer's ideas", async () => {
    const { service, repo } = await setup()
    repo.author = "ben"
    await service.capture({ spaceId: "s", title: "Tea" })
    const mine = await service.list("s", null, { whose: "mine", me: "ben" })
    expect(mine.ok && mine.value.items.map((i) => i.title)).toEqual(["Tea"])
  })
})
