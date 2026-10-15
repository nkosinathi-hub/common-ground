import { nextCursor, ok, PAGE_SIZE, type Cursor, type Page, type Result } from "@/shared/domain"
import {
  validateNote,
  validateRecipients,
  type Recommendation,
  type RecommendationResponse,
} from "../domain/recommendation"
import type { RecommendationsGateway } from "./ports"

/** What the recommend dialog sends: the title, who to, an optional note, and who is sending. */
export interface SendRequest {
  readonly itemId: string
  readonly recipientIds: readonly string[]
  readonly note: string
  readonly me: string
}

export class RecommendationsService {
  constructor(
    private readonly gateway: RecommendationsGateway,
    private readonly pageSize = PAGE_SIZE,
  ) {}

  async send({ itemId, recipientIds, note, me }: SendRequest): Promise<Result<string[]>> {
    const recipients = validateRecipients(recipientIds, me)
    if (!recipients.ok) return recipients
    const cleanNote = validateNote(note)
    if (!cleanNote.ok) return cleanNote
    return this.gateway.recommend({
      itemId,
      recipientIds: recipients.value,
      note: cleanNote.value,
    })
  }

  async inbox(spaceId: string, after: Cursor | null): Promise<Result<Page<Recommendation>>> {
    const size = this.pageSize
    const rows = await this.gateway.inbox({ spaceId, after, size })
    if (!rows.ok) return rows
    return ok({ items: rows.value, next: nextCursor(rows.value, size) })
  }

  respond = (id: string, response: RecommendationResponse) => this.gateway.respond(id, response)
}
