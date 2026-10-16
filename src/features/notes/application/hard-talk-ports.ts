import type { Result } from "@/shared/domain"
import type { Draft, DraftFields, RemindIn, ResponseKind } from "../domain"
import type { NoteRecord } from "./ports"

export type DraftRecord = Omit<Draft, "recipientName">

/** The author's own drafts (the server shows them to nobody else). */
export interface DraftsRepository {
  list(spaceId: string): Promise<Result<DraftRecord[]>>
  create(spaceId: string, fields: DraftFields): Promise<Result<DraftRecord>>
  update(id: string, fields: DraftFields): Promise<Result<DraftRecord>>
  remove(id: string): Promise<Result<void>>
  /** Sends the draft as it is saved on the server, then it is gone. */
  send(id: string): Promise<Result<NoteRecord>>
}

export interface ResponseRecord {
  readonly kind: ResponseKind
  readonly createdAt: string
}

export interface HardTalkRepository {
  /** "Something on my mind" notes to `me` in a space, newest first, with read state. */
  toMe(spaceId: string, me: string): Promise<Result<NoteRecord[]>>
  respond(
    noteId: string,
    kind: ResponseKind,
    remindIn: RemindIn | null,
  ): Promise<Result<ResponseRecord>>
}
