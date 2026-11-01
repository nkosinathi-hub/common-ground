import { describe, expect, it, vi } from "vitest"
import { readyRoom, useFakeClock } from "../testing/session-setup"
import { preparePlayer } from "./player-events"

useFakeClock()

describe("party media subscriptions", () => {
  it("does not flood Realtime with unchanged buffering presence", async () => {
    const { guest, hub, host } = await readyRoom()
    const track = vi.spyOn(hub.connections[1]!, "track")
    for (let i = 0; i < 50; i++) guest.player.buffer(false)
    expect(track).not.toHaveBeenCalled()
    for (let i = 0; i < 50; i++) guest.player.buffer(true)
    expect(track).toHaveBeenCalledTimes(1)
    guest.player.buffer(false)
    expect(track).toHaveBeenCalledTimes(2)
    guest.session.close()
    host.session.close()
  })

  it("leaves readiness unset if the browser rejects the gesture", async () => {
    const { guest, host } = await readyRoom()
    vi.spyOn(guest.player, "play").mockRejectedValue(new Error("gesture"))
    expect((await preparePlayer(guest.player)).ok).toBe(false)
    guest.session.close()
    host.session.close()
  })
})
