import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { appError, err } from "@/shared/domain"
import { notificationsSetup } from "../testing/notifications-setup"
import Provided from "@/shared/ui/testing/Provided.svelte"
import ActivityFeed from "./ActivityFeed.svelte"
import { provideNotifications } from "./context"
import NotificationsBell from "./NotificationsBell.svelte"
import { NotificationsStore } from "./notifications-store.svelte"

// A wide viewport, so the bell opens its popover.
beforeEach(() =>
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: true,
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
  })),
)
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function setup() {
  const fakes = notificationsSetup()
  const store = new NotificationsStore(fakes.service)
  const provide = () => provideNotifications({ service: fakes.service, store })
  return { ...fakes, store, provide }
}

describe("NotificationsBell", () => {
  it("shows why the inbox failed to load and retries", async () => {
    const { inbox, store, provide } = setup()
    const list = inbox.list.bind(inbox)
    inbox.list = async () => err(appError("network", "Could not reach the server"))
    await store.refresh()
    render(Provided, { props: { provide, component: NotificationsBell } })
    await fireEvent.click(screen.getByRole("button", { name: "Notifications" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server")
    inbox.list = list
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
  })
})

describe("ActivityFeed", () => {
  it("shows a loading state first, then an empty space", async () => {
    const { provide } = setup()
    const props = { spaceId: "s" }
    render(Provided, { props: { provide, component: ActivityFeed, props } })
    expect(screen.getByText("Gathering recent activity")).toBeInTheDocument()
    expect(await screen.findByText("Nothing yet")).toBeInTheDocument()
  })

  it("asks for the latest six only on the home card", async () => {
    const { activity, provide } = setup()
    const sizes: (number | undefined)[] = []
    const list = activity.list.bind(activity)
    activity.list = (spaceId, after, size) => {
      sizes.push(size)
      return list(spaceId, after, size)
    }
    render(Provided, {
      props: { provide, component: ActivityFeed, props: { spaceId: "s", limit: true } },
    })
    expect(await screen.findByText("Nothing yet")).toBeInTheDocument()
    expect(sizes).toEqual([6])
  })

  it("reports a failed load with a retry", async () => {
    const { activity, provide } = setup()
    activity.list = async () => err(appError("unknown", "Activity is unavailable"))
    render(Provided, { props: { provide, component: ActivityFeed, props: { spaceId: "s" } } })
    expect(await screen.findByRole("alert")).toHaveTextContent("Activity is unavailable")
  })
})
