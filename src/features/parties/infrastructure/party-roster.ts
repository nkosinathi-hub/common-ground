import { parsePresence } from "../domain/messages"
import type { Presence } from "../domain/party-machine"

/** Presence owns connection membership; broadcasts overlay the latest player state. */
export class PartyRoster {
  private members = new Map<string, Presence>()
  private updates = new Map<string, Presence>()

  sync(raw: Record<string, unknown[]>): boolean {
    const next = new Map<string, Presence>()
    for (const [key, entries] of Object.entries(raw)) {
      const person = entries.map(parsePresence).find((p) => p !== null)
      if (person) next.set(key, person)
    }
    const added = [...next.keys()].some((key) => !this.members.has(key))
    for (const key of this.members.keys()) if (!next.has(key)) this.updates.delete(key)
    this.members = next
    return added
  }

  update(raw: unknown): boolean {
    if (!raw || typeof raw !== "object") return false
    const packet = raw as { key?: unknown; person?: unknown }
    if (typeof packet.key !== "string" || !packet.key || packet.key.length > 64) return false
    const person = parsePresence(packet.person)
    if (!person) return false
    const member = this.members.get(packet.key)
    if (member && (member.userId !== person.userId || member.role !== person.role)) return false
    if (!member && !this.updates.has(packet.key) && this.updates.size >= 256) return false
    this.updates.set(packet.key, person)
    return true
  }

  get people(): Presence[] {
    return [...this.members].map(([key, baseline]) => {
      const fresh = this.updates.get(key)
      return fresh?.userId === baseline.userId && fresh.role === baseline.role ? fresh : baseline
    })
  }
}
