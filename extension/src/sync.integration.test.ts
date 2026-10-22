import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import { PartySession } from "@/features/parties/application/party-session"
import { SYNC } from "@/features/parties/domain/sync-constants"
import { partyOf } from "@/features/parties/testing/fake-party-gateway"
import { FakePartyHub } from "@/features/parties/testing/fake-party-hub"
import { netflixPlayer, pageSeeker } from "./netflix-player"
import { installSeekHandler } from "./page-seek"
import { fakeNetflixPage } from "./testing/fake-netflix"

beforeEach(() => void vi.useFakeTimers().setSystemTime(1_000_000))
afterEach(() => vi.useRealTimers())

const done = () => Promise.resolve(ok(undefined))
const service = { confirm: done, finish: done, handover: done }

/** Two members, each with the extension on their own netflix.com tab, on one party channel. */
async function twoTabs() {
  const hub = new FakePartyHub()
  const party = partyOf("p1", "host", { source: "netflix" })
  const member = (me: string, skew: number, joinedAt: string) => {
    const page = fakeNetflixPage()
    installSeekHandler(page.win)
    const player = netflixPlayer(
      page.page,
      pageSeeker(page.win, () => undefined),
    )
    const clock = { now: () => Date.now() + skew }
    const deps = { me, joinedAt, party, channel: hub, player, clock, role: "player" as const }
    const session = new PartySession({ ...deps, service })
    session.open()
    return { session, video: page.video }
  }
  const host = member("host", 0, "2026-10-22T20:00:01Z")
  const guest = member("guest", 900, "2026-10-22T20:00:02Z")
  await host.session.ready()
  await guest.session.ready()
  vi.advanceTimersByTime(3 * SYNC.stateIntervalMs)
  return { host, guest }
}

const drift = (a: { currentTime: number }, b: { currentTime: number }) =>
  Math.abs(a.currentTime - b.currentTime)

describe("two Netflix tabs in one party", () => {
  it("start together at the scheduled moment and stay within the drift tolerance", async () => {
    const { host, guest } = await twoTabs()
    host.session.play()
    vi.advanceTimersByTime(SYNC.scheduleLeadMs + 30_000)
    expect(host.video.playing && guest.video.playing).toBe(true)
    expect(drift(host.video, guest.video)).toBeLessThan(SYNC.driftToleranceS)
    expect(host.video.broken || guest.video.broken).toBe(false)
  })

  it("seek a member who fell far behind back to the party, through Netflix's API", async () => {
    const { host, guest } = await twoTabs()
    host.session.play()
    vi.advanceTimersByTime(10_000)
    guest.video.seekTo(guest.video.currentTime - SYNC.seekDriftS - 2)
    vi.advanceTimersByTime(2 * SYNC.stateIntervalMs)
    expect(drift(host.video, guest.video)).toBeLessThan(SYNC.driftToleranceS)
  })

  it("nudge a small drift away with the playback rate, then play at normal speed", async () => {
    const { host, guest } = await twoTabs()
    host.session.play()
    vi.advanceTimersByTime(10_000)
    guest.video.seekTo(guest.video.currentTime - 1)
    vi.advanceTimersByTime(SYNC.stateIntervalMs)
    expect(guest.video.playbackRate).toBe(1 + SYNC.nudgeRate)
    vi.advanceTimersByTime(30 * SYNC.stateIntervalMs)
    expect(drift(host.video, guest.video)).toBeLessThan(SYNC.driftToleranceS)
    expect(guest.video.playbackRate).toBe(1)
  })

  it("pause for both when either pauses", async () => {
    const { host, guest } = await twoTabs()
    host.session.play()
    vi.advanceTimersByTime(5000)
    guest.session.pause()
    expect(host.video.playing || guest.video.playing).toBe(false)
    expect(drift(host.video, guest.video)).toBeLessThan(SYNC.driftToleranceS)
  })
})
