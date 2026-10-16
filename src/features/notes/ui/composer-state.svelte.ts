import type { MemberRef } from "@/shared/domain"
import type { DraftsService } from "../application/drafts-service"
import {
  EMPTY_DRAFT,
  filledSections,
  type Draft,
  type DraftFields,
  type Expiry,
  type NoteKind,
  type SectionKey,
} from "../domain"
import { DraftAutosave } from "./draft-autosave.svelte"

/**
 * One composer for both kinds of note. A quick note's text is the first part of a "Something on
 * my mind" note, so switching keeps what was typed. Only a "Something on my mind" note is a
 * draft: it saves itself as the author writes.
 */
export class ComposerState {
  mode = $state<NoteKind>("note")
  to = $state("")
  sections = $state<Record<SectionKey, string>>({ happened: "", feel: "", matters: "", help: "" })
  pinned = $state(false)
  expiry = $state<Expiry>("never")
  responseWish = $state<DraftFields["responseWish"]>("any")
  supportWish = $state<DraftFields["supportWish"]>(null)
  error = $state<string | null>(null)
  sending = $state(false)
  readonly autosave: DraftAutosave
  private saved: string

  constructor(
    private readonly drafts: DraftsService,
    private readonly spaceId: () => string,
    draft: Draft | null,
  ) {
    const start = draft ?? { ...EMPTY_DRAFT, id: null }
    this.mode = draft ? "hard_talk" : "note"
    this.to = start.recipientId ?? ""
    this.sections = { ...this.sections, ...start.sections }
    this.responseWish = start.responseWish
    this.supportWish = start.supportWish
    this.autosave = new DraftAutosave((id) => drafts.save(spaceId(), id, this.fields()), start.id)
    this.saved = this.snapshot()
  }

  get body() {
    return this.sections.happened
  }
  set body(text: string) {
    this.sections.happened = text
  }

  fields(): DraftFields {
    const { to, responseWish, supportWish } = this
    return { recipientId: to || null, sections: { ...this.sections }, responseWish, supportWish }
  }

  private snapshot = () => JSON.stringify(this.fields())

  /** Switches kind; a "Something on my mind" note is always to one person. */
  switchTo(mode: NoteKind, recipients: readonly MemberRef[]) {
    this.mode = mode
    this.error = null
    if (mode === "hard_talk" && !this.to && recipients.length === 1) this.to = recipients[0]!.id
  }

  /** Called on every edit: saves a draft once it has words, never a quick note. */
  edited() {
    if (this.mode !== "hard_talk") return
    const now = this.snapshot()
    if (now === this.saved) return
    if (this.autosave.id === null && filledSections(this.sections).length === 0) return
    this.saved = now
    this.autosave.changed()
  }

  /** Closing keeps the draft: save what is left. */
  close = async () => {
    if (this.mode === "hard_talk") this.edited()
    await this.autosave.flush()
    this.autosave.stop()
  }

  /** A sent quick note took the draft's words with it, so the draft goes. */
  async dropDraft() {
    this.autosave.stop()
    const id = this.autosave.id
    if (id) await this.drafts.remove(id)
  }
}
