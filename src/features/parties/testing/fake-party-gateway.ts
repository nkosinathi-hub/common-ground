import { appError, err, ok, type Result } from "@/shared/domain"
import type { PartyGateway } from "../application/ports"
import type { Party, StartParty, TogetherProgress } from "../domain/party"

export const SPACE = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
export const ITEM = "1c9d2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61"

/** A party as the gateway returns it; the caller is its host unless members say otherwise. */
export const partyOf = (id: string, host: string, extra: Partial<Party> = {}): Party => ({
  id,
  spaceId: SPACE,
  watchItemId: ITEM,
  title: "Severance",
  catalog: { type: "tv", id: 95396 },
  hostId: host,
  source: "jellyfin",
  status: "planned",
  range: { from: { season: 1, episode: 1 }, to: { season: 1, episode: 1 } },
  startedAt: null,
  endedAt: null,
  createdAt: "2026-10-22T20:00:00Z",
  members: [{ userId: host, confirmed: false, joinedAt: "2026-10-22T20:00:00Z" }],
  ...extra,
})

const missing = () => err(appError("not_found", "That watch party is no longer available"))

/** In-memory party RPCs, acting as `me`; records every call as [name, ...args]. */
export class FakePartyGateway implements PartyGateway {
  parties = new Map<string, Party>()
  togetherAt: TogetherProgress = null
  calls: unknown[][] = []
  failNext: Result<never> | null = null

  constructor(public me = "me") {}

  private run<T>(name: string, args: unknown[], fn: () => Result<T>): Promise<Result<T>> {
    this.calls.push([name, ...args])
    const failure = this.failNext
    this.failNext = null
    return Promise.resolve(failure ?? fn())
  }

  private update(id: string, change: (p: Party) => Partial<Party>): Result<void> {
    const party = this.parties.get(id)
    if (!party) return missing()
    this.parties.set(id, { ...party, ...change(party) })
    return ok(undefined)
  }

  start = (input: StartParty) =>
    this.run("start", [input], () => {
      const id = `party-${this.parties.size + 1}`
      this.parties.set(id, partyOf(id, this.me, { range: input.range, source: input.source }))
      return ok(id)
    })

  join = (id: string) =>
    this.run("join", [id], () =>
      this.update(id, (p) => ({
        members: p.members.some((m) => m.userId === this.me)
          ? p.members
          : [...p.members, { userId: this.me, confirmed: false, joinedAt: "2026-10-22T20:01:00Z" }],
      })),
    )

  confirm = (id: string) =>
    this.run("confirm", [id], () =>
      this.update(id, (p) => ({
        members: p.members.map((m) => (m.userId === this.me ? { ...m, confirmed: true } : m)),
        status: p.hostId === this.me ? "live" : p.status,
      })),
    )

  finish = (id: string) =>
    this.run("finish", [id], () => this.update(id, () => ({ status: "ended" })))
  cancel = (id: string) =>
    this.run("cancel", [id], () => this.update(id, () => ({ status: "cancelled" })))
  handover = (id: string) =>
    this.run("handover", [id], () => this.update(id, () => ({ hostId: this.me })))

  get = (id: string) =>
    this.run("get", [id], () => {
      const party = this.parties.get(id)
      return party ? ok(party) : missing()
    })

  openFor = (item: string) =>
    this.run("openFor", [item], () =>
      ok(
        [...this.parties.values()].find(
          (p) => p.watchItemId === item && (p.status === "planned" || p.status === "live"),
        ) ?? null,
      ),
    )

  together = (item: string) => this.run("together", [item], () => ok(this.togetherAt))
}
