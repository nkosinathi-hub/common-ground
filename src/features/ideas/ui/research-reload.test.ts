import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { ChildCollection } from "../application/ports"
import { ResearchService } from "../application/research-service"
import type { Idea } from "../domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import { inMemoryResearch } from "../testing/in-memory-research"
import { ideasContext } from "./context"
import ResearchTab from "./ResearchTab.svelte"

const idea = { id: "i", spaceId: "s", title: "Tea" } as Idea
const viewer = { me: "u1", isOwner: false }

afterEach(cleanup)

describe("research panels", () => {
  it("load once per idea, not again when the idea is edited", async () => {
    const repo = inMemoryResearch("u1")
    const loads: string[] = []
    const count = <T, I>(name: string, collection: ChildCollection<T, I>) => {
      const list = collection.list.bind(collection)
      collection.list = (ideaId, after) => (loads.push(name), list(ideaId, after))
    }
    count("notes", repo.notes)
    count("links", repo.links)
    count("hypotheses", repo.hypotheses)
    const context = ideasContext(inMemoryIdeasService().service, new ResearchService(repo))
    const view = render(ResearchTab, { props: { idea, viewer }, context })
    await screen.findByText("No notes yet.")
    await view.rerender({ idea: { ...idea, title: "Tea bar" }, viewer })
    await view.rerender({ idea: { ...idea, id: "other" }, viewer })
    await screen.findByText("No hypotheses yet.")
    expect(loads.sort()).toEqual(["hypotheses", "hypotheses", "links", "links", "notes", "notes"])
  })
})
