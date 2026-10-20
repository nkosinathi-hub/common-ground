import { appError, err, ok, type Result } from "@/shared/domain"
import type { SimklGateway } from "../application/ports"
import type { SimklLink } from "../domain/types"

/** In-memory SimklGateway: a code is pending until approve(); calls are recorded by name. */
export class FakeSimklGateway implements SimklGateway {
  readonly calls: string[] = []
  readonly syncedAt = "2026-03-02T08:00:00.000Z"
  /** The next call fails with "Simkl is down". */
  failNext = false
  private approved: SimklLink | null = null

  constructor(public link: SimklLink | null = null) {}

  approve(link: SimklLink) {
    this.approved = link
  }

  private answer<T>(name: string, value: () => T): Promise<Result<T>> {
    this.calls.push(name)
    if (this.failNext) {
      this.failNext = false
      return Promise.resolve(err(appError("network", "Simkl is down")))
    }
    return Promise.resolve(ok(value()))
  }

  status = () => this.answer("status", () => this.link)

  startPin = () =>
    this.answer("pin", () => ({
      userCode: "ABCDE",
      verificationUrl: "https://simkl.com/pin",
      expiresIn: 900,
      interval: 5,
    }))

  poll = (userCode: string) =>
    this.answer(`poll:${userCode}`, () => {
      if (this.approved) this.link = this.approved
      return { connected: this.approved !== null }
    })

  sync = () =>
    this.answer("sync", () => {
      if (this.link) this.link = { ...this.link, lastSyncedAt: this.syncedAt }
      return { added: 0, lastSyncedAt: this.syncedAt }
    })

  disconnect = () =>
    this.answer("disconnect", () => {
      this.link = null
    })
}
