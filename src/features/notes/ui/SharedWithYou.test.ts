import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { notesHarness } from "../testing/notes-harness"
import { notesContext } from "./context"
import SharedWithYou from "./SharedWithYou.svelte"

const shared = { recipientId: "ben", sections: { feel: "Lonely lately" } }

afterEach(cleanup)

describe("SharedWithYou", () => {
  it("waits calmly at the top of Home until it is opened, then settles", async () => {
    const harness = notesHarness("ben")
    await harness.share("ana", shared)
    render(SharedWithYou, { props: { spaceId: "s" }, context: notesContext(harness.services) })
    const card = within(
      await screen.findByRole("region", { name: "Ana shared something with you" }),
    )
    expect(card.getByText("Take your time.")).toBeInTheDocument()
    expect(screen.queryByText("Lonely lately")).toBeNull()
    await fireEvent.click(card.getByRole("button", { name: "Open when you're ready" }))
    const reader = within(await screen.findByRole("dialog", { name: "From Ana" }))
    expect(reader.getByText("Lonely lately")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("region")).toBeNull())
    expect(screen.getByRole("dialog", { name: "From Ana" })).toBeInTheDocument()
  })

  it("shows nothing to the author or anyone else, and appears when one arrives", async () => {
    const harness = notesHarness("cy")
    await harness.share("ana", shared)
    render(SharedWithYou, { props: { spaceId: "s" }, context: notesContext(harness.services) })
    await waitFor(() => expect(screen.queryByRole("region")).toBeNull())
    await harness.share("ana", { ...shared, recipientId: "cy" })
    harness.arrive()
    expect(
      await screen.findByRole("region", { name: "Ana shared something with you" }),
    ).toBeVisible()
  })
})
