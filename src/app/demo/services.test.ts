import type { DateOnly } from "@/shared/domain"
import { afterEach, describe, expect, it, vi } from "vitest"
import { composeDemo } from "./services"
import { SPACE, demoId, today } from "./identity"
import { demoFetch, DEMO_READ_ONLY } from "./transport"

afterEach(() => vi.unstubAllGlobals())

describe("production services with sample data", () => {
  it("loads the production session, memberships, watchlist, idea and calendar without a server", async () => {
    const external = vi.fn(() => {
      throw new Error("Demo contacted a real server")
    })
    vi.stubGlobal("fetch", external)
    const services = composeDemo()
    await services.session.start()
    await services.spacesStore.refresh()
    expect(services.session.user?.displayName).toBe("Ana")
    expect(services.spacesStore.spaces[0]?.id).toBe(SPACE)
    const title = await services.watch.get(SPACE, demoId(10))
    expect(title.ok && title.value.item.title).toBe("Ted Lasso")
    const idea = await services.ideas.ideas.get(demoId(20))
    expect(idea.ok && idea.value.title).toBe("A weekend in the Cederberg")
    const events = await services.calendar.week(SPACE, today as DateOnly, "Africa/Johannesburg")
    expect(events.ok && events.value.length).toBe(2)
    const catalog = await services.catalog.details(SPACE, { type: "tv", id: 97546 })
    expect(catalog.ok && catalog.value.seasons.length).toBe(3)
    expect(external).not.toHaveBeenCalled()
    services.session.dispose()
  })

  it("refuses destructive actions and external destinations without modifying sample rows", async () => {
    const services = composeDemo()
    const removed = await services.watch.remove(demoId(10))
    expect(removed.ok).toBe(false)
    if (!removed.ok) expect(removed.error.message).toBe(DEMO_READ_ONLY)
    const reply = await demoFetch("https://production.example/rest/v1/watch_items")
    expect(reply.status).toBe(400)
    const original = await services.watch.get(SPACE, demoId(10))
    expect(original.ok && original.value.item.title).toBe("Ted Lasso")
  })
})
