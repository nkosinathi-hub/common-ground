import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { note, notificationsSetup } from "../testing/notifications-setup"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideNotifications } from "./context"
import NotificationsBell from "./NotificationsBell.svelte"
import { NotificationsStore } from "./notifications-store.svelte"

/** Pretends the viewport is at least 640px wide, or not. */
function viewport(wide: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: wide && query.includes("min-width: 640px"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function setup(wide: boolean, ...items: ReturnType<typeof note>[]) {
  viewport(wide)
  const fakes = notificationsSetup()
  fakes.inbox.items = items
  const store = new NotificationsStore(fakes.service)
  await store.refresh()
  const provide = () => provideNotifications({ service: fakes.service, store })
  render(Provided, { props: { provide, component: NotificationsBell } })
  return { store }
}

describe("NotificationsBell layout", () => {
  it("opens a popover on wider screens", async () => {
    await setup(true)
    await fireEvent.click(screen.getByRole("button", { name: "Notifications" }))
    expect(await screen.findByText("You are all caught up.")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("opens a full-screen sheet on phones that its header Close button closes", async () => {
    await setup(false)
    await fireEvent.click(screen.getByRole("button", { name: "Notifications" }))
    const sheet = await screen.findByRole("dialog", { name: "Notifications" })
    expect(sheet).toHaveClass("h-dvh", "w-full", "max-w-none")
    expect(sheet).toHaveTextContent("You are all caught up.")
    // The first Close is the header's; the sheet's own corner one is hidden by CSS.
    const [close] = screen.getAllByRole("button", { name: "Close" })
    expect(close).toHaveClass("size-11")
    await fireEvent.click(close!)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("links each kind to its own place and marks all read from the sheet", async () => {
    const { store } = await setup(false, note("n1", { type: "mention", subjectId: "i1" }))
    await fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }))
    const link = await screen.findByRole("link", { name: /Ana/ })
    expect(link.getAttribute("href")).toMatch(/\/ideas\/i1\/discussion$/)
    await fireEvent.click(screen.getByRole("button", { name: "Mark all read" }))
    await waitFor(() => expect(store.unread).toBe(0))
  })
})
