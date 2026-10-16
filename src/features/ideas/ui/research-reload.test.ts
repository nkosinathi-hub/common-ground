import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { ChildCollection } from "../application/ports"
import { ResearchService } from "../application/research-service"
import type { Idea } from "../domain"
import { inMemoryResearch } from "../testing/in-memory-research"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideResearch } from "./context"
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
    const provide = () => provideResearch({ service: new ResearchService(repo) })
    const view = render(Provided, {
      props: { provide, component: ResearchTab, props: { idea, viewer } },
    })
    await screen.findByText("No notes yet.")
    // A props key is read as render options, so Provided's own `props` goes one level down.
    const show = (next: Idea) => view.rerender({ props: { props: { idea: next, viewer } } })
    await show({ ...idea, title: "Tea bar" })
    await show({ ...idea, id: "other" })
    await screen.findByText("No hypotheses yet.")
    expect(loads.sort()).toEqual(["hypotheses", "hypotheses", "links", "links", "notes", "notes"])
  })
})
