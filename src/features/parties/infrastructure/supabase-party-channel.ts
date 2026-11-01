import type { Db } from "@/shared/infrastructure/supabase"
import type { PartyChannel, PartyChannelHandlers, PartyConnection } from "../application/ports"
import { parseMessage, type PartyMessage } from "../domain/messages"
import type { Presence } from "../domain/party-machine"
import { PartyRoster } from "./party-roster"
import { PresencePublisher } from "./presence-publisher"

const EVENT = "party"
const PRESENCE = "party-presence"
const LOST = new Set(["CHANNEL_ERROR", "TIMED_OUT"])
const UNHEALTHY = new Set(["timeout", "disconnected", "error"])

/** Private membership presence is tracked once per join; fast state uses private broadcasts. */
export class SupabasePartyChannel implements PartyChannel {
  constructor(private readonly db: Db) {}

  connect(partyId: string, handlers: PartyChannelHandlers): PartyConnection {
    const key = crypto.randomUUID()
    const config = { private: true, broadcast: { self: false }, presence: { key } }
    const channel = this.db.channel(`party:${partyId}`, { config })
    const roster = new PartyRoster()
    let mine: Presence | null = null
    let joined = false
    const announce = (person: Presence) => {
      const payload = { key, person }
      roster.update(payload)
      void channel.send({ type: "broadcast", event: PRESENCE, payload })
      handlers.onPresence(roster.people)
    }
    const publisher = new PresencePublisher(announce)
    channel
      .on("broadcast", { event: EVENT }, ({ payload }) => {
        const message = parseMessage(payload)
        if (message) handlers.onMessage(message)
      })
      .on("broadcast", { event: PRESENCE }, ({ payload }) => {
        if (roster.update(payload)) handlers.onPresence(roster.people)
      })
      .on("presence", { event: "sync" }, () => {
        const added = roster.sync(channel.presenceState())
        handlers.onPresence(roster.people)
        if (added && mine && joined) announce(mine) // A late joiner needs current readiness.
      })
    const onStatus = (status: string) => {
      const next = status === "SUBSCRIBED"
      if (next && !joined && mine) void channel.track(mine)
      joined = next
      publisher.online(joined)
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
      if (channel.state === "joined") onStatus("SUBSCRIBED")
    }
    document.addEventListener("visibilitychange", onVisible)
    return {
      send: (message: PartyMessage) =>
        void channel.send({ type: "broadcast", event: EVENT, payload: message }),
      track: (presence: Presence) => {
        const first = mine === null
        mine = presence
        if (first && joined) void channel.track(presence)
        publisher.track(presence)
      },
      leave: () => {
        publisher.close()
        document.removeEventListener("visibilitychange", onVisible)
        this.db.realtime.onHeartbeat(() => undefined)
        void this.db.removeChannel(channel)
        handlers.onStatus("closed")
      },
    }
  }
}
