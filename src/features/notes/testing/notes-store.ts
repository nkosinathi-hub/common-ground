import type { NoteRecord, ReplyRecord } from "../application/ports"
import type { ResponseKind } from "../domain"

export type Stored = Omit<NoteRecord, "readAt" | "replyCount" | "lastReplyAt" | "latestResponse">
export interface StoredResponse {
  readonly noteId: string
  readonly kind: ResponseKind
  readonly createdAt: string
}

/** Notes, replies, reads and responses as stored, seen as the signed-in member `me`. */
export class NotesStore {
  me = "ana"
  readonly rows: Stored[] = []
  readonly replies: ReplyRecord[] = []
  readonly reads = new Map<string, string>()
  readonly responses: StoredResponse[] = []
  private tick = 0

  stamp() {
    this.tick += 1
    return new Date(Date.UTC(2026, 9, 16, 9, 0, this.tick)).toISOString()
  }
  visible = (n: Stored) =>
    n.recipientId === null || n.recipientId === this.me || n.authorId === this.me
  read(noteId: string) {
    this.reads.set(`${noteId}:${this.me}`, this.stamp())
  }
  record(n: Stored): NoteRecord {
    const thread = this.replies.filter((r) => r.noteId === n.id)
    const latest = this.responses.findLast((r) => r.noteId === n.id)
    const readAt = this.reads.get(`${n.id}:${this.me}`) ?? null
    return {
      ...n,
      readAt,
      replyCount: thread.length,
      lastReplyAt: thread.at(-1)?.createdAt ?? null,
      latestResponse: latest ? { kind: latest.kind, at: latest.createdAt } : null,
    }
  }
}
