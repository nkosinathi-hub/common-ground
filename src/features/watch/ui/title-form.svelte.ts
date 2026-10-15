import { ok, type Result } from "@/shared/domain"
import type { ManualTitleInput, MediaType, SharedIntent, WatchItem } from "../domain/types"
import { parseYear } from "../domain/validation"

/** Inputs for adding a title by hand or editing one. Kept as typed when a save fails. */
export class TitleFormState {
  title = $state("")
  mediaType = $state<MediaType>("movie")
  year = $state("")
  synopsis = $state("")
  note = $state("")
  intent = $state<SharedIntent>("want_to_watch")

  fill(item: WatchItem): void {
    this.title = item.title
    this.mediaType = item.mediaType
    this.year = item.releaseYear?.toString() ?? ""
    this.synopsis = item.synopsis
    this.note = item.availabilityNote ?? ""
    this.intent = item.intent
  }

  clear(intent: SharedIntent = "want_to_watch"): void {
    this.title = ""
    this.mediaType = "movie"
    this.year = ""
    this.synopsis = ""
    this.note = ""
    this.intent = intent
  }

  toInput(): Result<ManualTitleInput> {
    const year = parseYear(this.year)
    if (!year.ok) return year
    return ok({
      title: this.title,
      mediaType: this.mediaType,
      releaseYear: year.value,
      synopsis: this.synopsis,
      availabilityNote: this.note,
      intent: this.intent,
    })
  }
}
