import { describe, expect, it, vi } from "vitest"
import { SYNC } from "../domain/sync-constants"
import { partyRoom, useFakeClock } from "../testing/session-setup"

useFakeClock()

const settle = () => vi.advanceTimersByTime(3 * SYNC.stateIntervalMs)
const kinds = (send: ReturnType<typeof vi.fn>) =>
  send.mock.calls.map(([m]) => (m as { kind: string }).kind)

/** A Netflix party (#66): the host's extension plays, the host's phone is the remote. */
async function netflixRoom() {
  const room = partyRoom({ host: 0, "host/remote": 400, guest: 700 })
  const player = room.member("host", true, "player")
  const remote = room.member("host", false, "remote")
  const guest = room.member("guest", true, "player")
  await player.session.ready()
  await guest.session.ready()
  settle()
  return { ...room, player, remote, guest }
}

describe("a remote beside the host's player", () => {
  it("follows the player's clock and never speaks for the host", async () => {
    const { hub, player, remote } = await netflixRoom()
    expect(remote.session.now()).toBe(player.session.now())
    const send = vi.spyOn(hub.connections[1]!, "send")
    settle()
    expect(kinds(send).every((kind) => kind === "ping")).toBe(true)
    expect(send).toHaveBeenCalled()
  })

  it("plays together without being ready itself, and both players keep in sync", async () => {
    const { player, remote, guest } = await netflixRoom()
    remote.session.play()
    expect(guest.session.view.state.phase).toBe("playing")
    vi.advanceTimersByTime(10_000)
    expect(player.player.playing && guest.player.playing).toBe(true)
    const drift = Math.abs(player.player.currentTime() - guest.player.currentTime())
    expect(drift).toBeLessThan(SYNC.driftToleranceS)
    remote.session.pause()
    expect(player.player.playing || guest.player.playing).toBe(false)
  })
})

describe("remotes with no player connected", () => {
  it("fall back to the co-watch: the host's remote keeps the clock", async () => {
    const room = partyRoom({ host: 0, guest: 700 })
    const host = room.member("host", false, "remote")
    const guest = room.member("guest", false, "remote")
    await host.session.ready()
    await guest.session.ready()
    settle()
    expect(guest.session.now()).toBe(host.session.now())
    host.session.countdown()
    expect(guest.session.view.state.phase).toBe("playing")
    vi.advanceTimersByTime(5000)
    const send = vi.spyOn(room.hub.connections[0]!, "send")
    const player = room.member("host", true, "player")
    expect(player.session.view.state.phase).toBe("playing")
    send.mockClear()
    settle()
    expect(kinds(send)).not.toContain("state")
  })
})
