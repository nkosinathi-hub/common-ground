import { describe, expect, it, vi } from "vitest"
import { countdownAt } from "../domain/countdown"
import { SYNC } from "../domain/sync-constants"
import { readyRoom, useFakeClock } from "../testing/session-setup"

useFakeClock()

/** Two people watching on a TV: no player in the app. */
const cowatch = () => readyRoom(undefined, false)

describe("co-watch session", () => {
  it("counts down 3-2-1 on everyone's screen to the same moment", async () => {
    const { host, guest } = await cowatch()
    host.session.countdown()
    const startAt = guest.session.view.state.timeline.at
    expect(countdownAt(startAt, guest.session.now())).toBe(SYNC.countdownS)
    vi.advanceTimersByTime(SYNC.scheduleLeadMs + 1000)
    expect(countdownAt(startAt, guest.session.now())).toBe(2)
    vi.advanceTimersByTime(2000)
    expect(countdownAt(startAt, host.session.now())).toBe(0)
  })

  it("lets only the host start the countdown, once everyone is ready", async () => {
    const { guest } = await cowatch()
    guest.session.countdown()
    expect(guest.session.view.state.phase).toBe("lobby")
  })

  it("shows a pause by either person on both screens", async () => {
    const { host, guest } = await cowatch()
    host.session.countdown()
    vi.advanceTimersByTime(10_000)
    guest.session.pause()
    expect(host.session.view.state.phase).toBe("paused")
    host.session.play()
    expect(guest.session.view.state.phase).toBe("playing")
  })
})
