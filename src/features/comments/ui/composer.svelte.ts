import { mentionCandidates, type MemberRef } from "../domain/mentions"

/** Composer draft. Mentions are picked from members and kept as ids beside the text. */
export class ComposerState {
  body = $state("")
  spoiler = $state(false)
  mentionIds = $state<string[]>([])
  pickerOpen = $state(false)
  query = $state("")

  candidates(members: readonly MemberRef[], me: string): MemberRef[] {
    return mentionCandidates(members, this.query, me, this.mentionIds)
  }

  /** Typing @ opens the picker; returns true when the key was consumed. */
  handleKey(key: string): boolean {
    if (key !== "@") return false
    this.openPicker()
    return true
  }

  openPicker() {
    this.query = ""
    this.pickerOpen = true
  }

  closePicker() {
    this.pickerOpen = false
    this.query = ""
  }

  choose(id: string) {
    if (!this.mentionIds.includes(id)) this.mentionIds = [...this.mentionIds, id]
    this.closePicker()
  }

  unmention(id: string) {
    this.mentionIds = this.mentionIds.filter((m) => m !== id)
  }

  get draft() {
    return { body: this.body, spoiler: this.spoiler, mentionIds: [...this.mentionIds] }
  }

  reset() {
    this.body = ""
    this.spoiler = false
    this.mentionIds = []
    this.closePicker()
  }
}
