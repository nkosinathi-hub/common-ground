import type { RealtimeChannel } from "@supabase/supabase-js"
import type { Db } from "@/shared/infrastructure/supabase"
import type { PartyChannel, PartyChannelHandlers, PartyConnection } from "../application/ports"
import { parseMessage, parsePresence, type PartyMessage } from "../domain/messages"
import type { Presence } from "../domain/party-machine"

const EVENT = "party"
const LOST = new Set(["CHANNEL_ERROR", "TIMED_OUT"])
const UNHEALTHY = new Set(["timeout", "disconnected", "error"])

/**
 * The private Realtime channel 'party:<id>': broadcast for messages, presence for ready and
 * buffering. RLS on realtime.messages admits only the party's members. A missed heartbeat
 * reports reconnecting (supabase-js rejoins by itself); coming back to the app reconnects and
 * reports joined again, so the session asks the host for the state.
 */
export class SupabasePartyChannel implements PartyChannel {
  constructor(private readonly db: Db) {}

  connect(partyId: string, handlers: PartyChannelHandlers): PartyConnection {
    const config = { private: true, broadcast: { self: false }, presence: { key: "" } }
    const channel = this.db.channel(`party:${partyId}`, { config })
    let mine: Presence | null = null
    let joined = false
    channel
      .on("broadcast", { event: EVENT }, ({ payload }) => {
        const message = parseMessage(payload)
        if (message) handlers.onMessage(message)
      })
      .on("presence", { event: "sync" }, () => handlers.onPresence(people(channel)))
    const onStatus = (status: string) => {
      joined = status === "SUBSCRIBED"
      if (joined && mine) void channel.track(mine)
      if (joined) handlers.onStatus("joined")
      else if (LOST.has(status)) handlers.onStatus("reconnecting")
    }
    void this.db.realtime.setAuth().then(() => channel.subscribe(onStatus))
    this.db.realtime.onHeartbeat((status) => {
      if (UNHEALTHY.has(status)) handlers.onStatus("reconnecting")
    })
    const onVisible = () => {
      if (document.visibilityState !== "visible") return
      if (!this.db.realtime.isConnected()) this.db.realtime.connect()
      if (channel.state === "joined") handlers.onStatus("joined")
    }
    document.addEventListener("visibilitychange", onVisible)
    return {
      send: (message: PartyMessage) =>
        void channel.send({ type: "broadcast", event: EVENT, payload: message }),
      track: (presence: Presence) => {
        mine = presence
        if (joined) void channel.track(presence)
      },
      leave: () => {
        document.removeEventListener("visibilitychange", onVisible)
        this.db.realtime.onHeartbeat(() => undefined)
        void this.db.removeChannel(channel)
        handlers.onStatus("closed")
      },
    }
  }
}

function people(channel: RealtimeChannel): Presence[] {
  return Object.values(channel.presenceState())
    .flat()
    .map(parsePresence)
    .filter((p): p is Presence => p !== null)
}
