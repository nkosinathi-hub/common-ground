import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { Idea } from "../domain"
import IdeaCard from "./IdeaCard.svelte"

const at = "2026-10-16T09:00:00Z"
const idea = {
  id: "i",
  title: "Zine",
  stage: "inbox",
  tags: [],
  brief: {},
  createdBy: "ana",
  collaborators: [{ userId: "ben", invitedBy: "ana", invitedAt: at, acceptedAt: at }],
} as unknown as Idea

afterEach(cleanup)

describe("IdeaCard", () => {
  it("marks an idea with more than one person on it as ours", () => {
    render(IdeaCard, { props: { idea, href: "#", onMove: () => {} } })
    expect(screen.getByText("Our idea")).toBeInTheDocument()
  })

  it("leaves a solo idea unmarked, even with an invite pending", () => {
    const pending = [{ ...idea.collaborators[0]!, acceptedAt: null }]
    render(IdeaCard, {
      props: { idea: { ...idea, collaborators: pending }, href: "#", onMove: () => {} },
    })
    expect(screen.queryByText("Our idea")).toBeNull()
  })
})
