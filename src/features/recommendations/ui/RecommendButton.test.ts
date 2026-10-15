import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { RecommendationsService } from "../application/recommendations-service"
import { FakeRecommendationsGateway } from "../testing/fake-recommendations-gateway"
import { RECOMMENDATIONS_CONTEXT } from "./context"
import RecommendButton from "./RecommendButton.svelte"

const MEMBERS = [
  { id: "me", displayName: "Nkosi" },
  { id: "zola", displayName: "Zola" },
  { id: "anele", displayName: "Anele" },
]

function setup(members = MEMBERS) {
  const gateway = new FakeRecommendationsGateway()
  const context = new Map([[RECOMMENDATIONS_CONTEXT, new RecommendationsService(gateway)]])
  render(RecommendButton, { props: { spaceId: "s", itemId: "w1", members, me: "me" }, context })
  return gateway
}
const openDialog = async () => {
  await fireEvent.click(screen.getByRole("button", { name: "Recommend" }))
  return screen.findByRole("dialog")
}

afterEach(cleanup)

describe("RecommendButton", () => {
  it("sends to the chosen members with a note", async () => {
    const gateway = setup()
    const dialog = await openDialog()
    expect(within(dialog).queryByLabelText("Nkosi")).toBeNull()
    await fireEvent.click(within(dialog).getByLabelText("Zola"))
    await fireEvent.click(within(dialog).getByLabelText("Anele"))
    await fireEvent.click(within(dialog).getByLabelText("Anele"))
    await fireEvent.input(within(dialog).getByLabelText("Note (optional)"), {
      target: { value: "Episode 10" },
    })
    await fireEvent.click(within(dialog).getByRole("button", { name: "Send" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(gateway.sent).toEqual([{ itemId: "w1", recipientId: "zola", note: "Episode 10" }])
  })

  it("asks for a recipient and reports a duplicate pending recommendation", async () => {
    const gateway = setup()
    gateway.sent.push({ itemId: "w1", recipientId: "zola", note: null })
    const dialog = await openDialog()
    await fireEvent.click(within(dialog).getByRole("button", { name: "Send" }))
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/choose at least one/i)
    await fireEvent.click(within(dialog).getByLabelText("Zola"))
    await fireEvent.click(within(dialog).getByRole("button", { name: "Send" }))
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/already has this/i)
  })

  it("is disabled when nobody else is in the space", () => {
    setup([{ id: "me", displayName: "Nkosi" }])
    expect(screen.getByRole("button", { name: "Recommend" })).toBeDisabled()
  })
})
