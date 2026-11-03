import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { SPACE_ID } from "../testing/fixtures"
import { watchFakes } from "../testing/render-context"
import AddTitleDialog from "./AddTitleDialog.svelte"
import { provideWatch } from "./context"

afterEach(cleanup)
function setup(defaultIntent = "want_to_watch") {
  const fakes = watchFakes(),
    onAdded = vi.fn()
  render(Provided, {
    props: {
      provide: () => provideWatch(fakes.context),
      component: AddTitleDialog,
      props: { open: true, spaceId: SPACE_ID, onAdded, defaultIntent },
    },
  })
  return { ...fakes, onAdded }
}

describe("manual title fallback", () => {
  it("saves once, reports the title and closes", async () => {
    const { gateway, onAdded } = setup()
    await fireEvent.input(await screen.findByLabelText("Title"), {
      target: { value: "Home video" },
    })
    await fireEvent.click(screen.getByRole("button", { name: "Add title" }))
    await waitFor(() => expect(gateway.items.map((item) => item.title)).toEqual(["Home video"]))
    await waitFor(() => expect(onAdded).toHaveBeenCalledExactlyOnceWith(gateway.items[0]!.id))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })
  it("uses the space's default list without a separate catalog field", async () => {
    setup("watch_together")
    expect(await screen.findByLabelText("Add to")).toHaveValue("watch_together")
    expect(screen.queryByRole("searchbox")).toBeNull()
    expect(screen.getByRole("button", { name: "Add title" })).toBeDisabled()
  })
  it("cancels without writing", async () => {
    const { gateway, onAdded } = setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(gateway.items).toEqual([])
    expect(onAdded).not.toHaveBeenCalled()
  })
})
