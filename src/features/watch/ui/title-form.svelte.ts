import { ok, type Result } from "@/shared/domain"
import type { MediaType, TitleDetailsInput, WatchItem } from "../domain/types"
import { parseYear } from "../domain/validation"

/** Inputs for adding a title by hand or editing one. Kept as typed when a save fails. */
export class TitleFormState {
  title = $state("")
  mediaType = $state<MediaType>("movie")
  year = $state("")
  synopsis = $state("")
  note = $state("")

  fill(item: WatchItem): void {
    this.title = item.title
    this.mediaType = item.mediaType
    this.year = item.releaseYear?.toString() ?? ""
    this.synopsis = item.synopsis
    this.note = item.availabilityNote ?? ""
  }

  toInput(): Result<TitleDetailsInput> {
    const year = parseYear(this.year)
    if (!year.ok) return year
    return ok({
      title: this.title,
      mediaType: this.mediaType,
      releaseYear: year.value,
      synopsis: this.synopsis,
      availabilityNote: this.note,
    })
  }
}
