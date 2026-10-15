import { appError, err, ok, type AppError, type Cursor } from "@/shared/domain"
import type { RecommendationsGateway } from "../application/ports"
import type { Recommendation, RecommendationResponse } from "../domain/recommendation"

const START = Date.parse("2026-10-15T10:00:00.000Z")

export interface SentRecommendation {
  readonly itemId: string
  readonly recipientId: string
  readonly note: string | null
}

/** In-memory inbox for "me" plus a log of what was sent, with the pending-duplicate rule. */
export class FakeRecommendationsGateway implements RecommendationsGateway {
  received: Recommendation[] = []
  sent: SentRecommendation[] = []
  calls: string[] = []
  failWith: AppError | null = null
  private seq = 0

  receive(spaceId: string, count: number, over: Partial<Recommendation> = {}) {
    for (let i = 0; i < count; i += 1) {
      this.seq += 1
      this.received.push({
        id: `r${this.seq}`,
        createdAt: new Date(START + this.seq * 1000).toISOString(),
        spaceId,
        itemId: `w${this.seq}`,
        itemTitle: `Title ${this.seq}`,
        senderName: "Zola",
        note: null,
        status: "pending",
        ...over,
      })
    }
  }

  async recommend(itemId: string, recipientIds: readonly string[], note: string | null) {
    this.calls.push(`recommend:${itemId}`)
    if (this.failWith) return err(this.failWith)
    const duplicate = recipientIds.some((r) =>
      this.sent.some((s) => s.itemId === itemId && s.recipientId === r),
    )
    if (duplicate)
      return err(appError("validation", "That member already has this recommendation waiting"))
    this.sent.push(...recipientIds.map((recipientId) => ({ itemId, recipientId, note })))
    return ok(recipientIds.map((_, i) => `sent${this.sent.length + i}`))
  }

  async inbox(spaceId: string, before: Cursor | null, size: number) {
    if (this.failWith) return err(this.failWith)
    const rows = this.received
      .filter((r) => r.spaceId === spaceId && r.status === "pending")
      .filter(
        (r) =>
          !before ||
          r.createdAt < before.createdAt ||
          (r.createdAt === before.createdAt && r.id < before.id),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    return ok(rows.slice(0, size))
  }

  async respond(id: string, response: RecommendationResponse) {
    this.calls.push(`${response}:${id}`)
    if (this.failWith) return err(this.failWith)
    this.received = this.received.map((r) => (r.id === id ? { ...r, status: response } : r))
    return ok(undefined)
  }
}
