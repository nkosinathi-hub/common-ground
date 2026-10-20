import type { PartyChannel, PartyChannelHandlers, PartyConnection } from "../application/ports"
import type { PartyMessage } from "../domain/messages"
import type { Presence } from "../domain/party-machine"

/** One member's end of the fake channel. */
class FakeConnection implements PartyConnection {
  open = true
  presence: Presence | null = null

  constructor(
    private readonly hub: FakePartyHub,
    readonly handlers: PartyChannelHandlers,
  ) {}

  send(message: PartyMessage): void {
    if (this.open) this.hub.deliver(this, message)
  }

  track(presence: Presence): void {
    this.presence = presence
    this.hub.syncPresence()
  }

  leave(): void {
    this.open = false
    this.hub.syncPresence()
  }
}

/**
 * Realtime between sessions in one test: broadcasts reach every other open connection (not the
 * sender, as Supabase broadcast with self off), and presence goes to everyone on each change.
 */
export class FakePartyHub implements PartyChannel {
  readonly connections: FakeConnection[] = []
  readonly sent: PartyMessage[] = []
  topics: string[] = []

  connect(partyId: string, handlers: PartyChannelHandlers): PartyConnection {
    const connection = new FakeConnection(this, handlers)
    this.connections.push(connection)
    this.topics.push(`party:${partyId}`)
    handlers.onStatus("joined")
    return connection
  }

  deliver(from: FakeConnection, message: PartyMessage): void {
    this.sent.push(message)
    for (const c of this.connections) if (c !== from && c.open) c.handlers.onMessage(message)
  }

  syncPresence(): void {
    const people = this.connections.filter((c) => c.open && c.presence).map((c) => c.presence!)
    for (const c of this.connections) if (c.open) c.handlers.onPresence(people)
  }

  /** The member's link drops (out of presence) and comes back. */
  drop(index: number): void {
    const c = this.connections[index]!
    c.open = false
    c.handlers.onStatus("reconnecting")
    this.syncPresence()
  }

  restore(index: number): void {
    const c = this.connections[index]!
    c.open = true
    c.handlers.onStatus("joined")
  }
}
