import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import SessionsCard from "./SessionsCard.svelte"

afterEach(cleanup)

describe("SessionsCard", () => {
  it("signs out of every device, this one included", async () => {
    const onSignOutEverywhere = vi.fn()
    render(SessionsCard, { onSignOutEverywhere })
    await fireEvent.click(screen.getByRole("button", { name: "Sign out everywhere" }))
    expect(onSignOutEverywhere).toHaveBeenCalledOnce()
  })
})
