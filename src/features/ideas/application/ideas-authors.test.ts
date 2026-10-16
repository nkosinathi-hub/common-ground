import { describe, expect, it } from "vitest"
import { FakeMemberDirectory } from "@/shared/domain/testing/fake-members"
import { InMemoryCollaborators } from "../testing/in-memory-collaborators"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { IdeasService } from "./ideas-service"

const ana = { id: "ana", displayName: "Ana" }
const ben = { id: "ben", displayName: "Ben" }

describe("IdeasService people", () => {
  it("offers current members but names removed starters while they are visible", async () => {
    const repo = new InMemoryIdeas()
    const directory = new FakeMemberDirectory([ana], [ben])
    const service = new IdeasService(
      repo,
      new InMemoryCollaborators(repo, () => []),
      directory,
      directory,
    )
    expect(await service.members("s")).toEqual({ ok: true, value: [ana] })
    expect(await service.authors("s")).toEqual({ ok: true, value: [ana, ben] })
  })

  it("names from current members alone when no author directory is given", async () => {
    const repo = new InMemoryIdeas()
    const directory = new FakeMemberDirectory([ana], [ben])
    const service = new IdeasService(repo, new InMemoryCollaborators(repo, () => []), directory)
    expect(await service.authors("s")).toEqual({ ok: true, value: [ana] })
  })
})
