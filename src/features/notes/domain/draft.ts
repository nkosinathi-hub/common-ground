import { editedAgo, type ResponseWish, type Sections, type SupportWish } from "./hard-talk"

/** What a draft holds; every part is optional while drafting. */
export interface DraftFields {
  readonly recipientId: string | null
  readonly sections: Sections
  readonly responseWish: ResponseWish
  readonly supportWish: SupportWish | null
}

/** A "Something on my mind" draft, seen only by its author. */
export interface Draft extends DraftFields {
  readonly id: string
  readonly spaceId: string
  /** Null when no one is chosen yet, or they have left the space. */
  readonly recipientName: string | null
  readonly updatedAt: string
}

export const EMPTY_DRAFT: DraftFields = {
  recipientId: null,
  sections: {},
  responseWish: "any",
  supportWish: null,
}

/** "To Ben · edited 2h ago". */
export const draftLabel = (draft: Pick<Draft, "recipientName" | "updatedAt">, now: Date) =>
  `${draft.recipientName ? `To ${draft.recipientName}` : "No one chosen yet"} · edited ${editedAgo(draft.updatedAt, now)}`

/** The moment a draft save landed, as stored for "Draft saved 14:32". */
export const savedStamp = (): string => new Date().toISOString()
