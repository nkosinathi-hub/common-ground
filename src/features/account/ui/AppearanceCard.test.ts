import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { userPrefersMode } from "mode-watcher"
import { afterEach, describe, expect, it } from "vitest"
import AppearanceCard from "./AppearanceCard.svelte"

afterEach(cleanup)

describe("AppearanceCard", () => {
  it("offers light, dark and system, and keeps the saved choice on this device", async () => {
    render(AppearanceCard)
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked()
    await fireEvent.click(screen.getByRole("radio", { name: "Dark" }))
    expect(userPrefersMode.current).toBe("system")
    await fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(userPrefersMode.current).toBe("dark")
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked()
  })
})
