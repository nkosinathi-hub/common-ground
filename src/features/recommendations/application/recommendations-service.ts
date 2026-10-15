import { nextCursor, ok, PAGE_SIZE, type Cursor, type Page, type Result } from "@/shared/domain"
import {
  validateNote,
  validateRecipients,
  type Recommendation,
  type RecommendationResponse,
} from "../domain/recommendation"
import type { RecommendationsGateway } from "./ports"

export class RecommendationsService {
  constructor(
    private readonly gateway: RecommendationsGateway,
    private readonly pageSize = PAGE_SIZE,
  ) {}

  async send(
    itemId: string,
    recipientIds: readonly string[],
    note: string,
    me: string,
  ): Promise<Result<string[]>> {
    const recipients = validateRecipients(recipientIds, me)
    if (!recipients.ok) return recipients
    const cleanNote = validateNote(note)
    if (!cleanNote.ok) return cleanNote
    return this.gateway.recommend(itemId, recipients.value, cleanNote.value)
  }

  async inbox(spaceId: string, before: Cursor | null): Promise<Result<Page<Recommendation>>> {
    const rows = await this.gateway.inbox(spaceId, before, this.pageSize)
    if (!rows.ok) return rows
    return ok({ items: rows.value, next: nextCursor(rows.value, this.pageSize) })
  }

  respond = (id: string, response: RecommendationResponse) => this.gateway.respond(id, response)
}
