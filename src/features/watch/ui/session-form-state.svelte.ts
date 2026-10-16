import type { DateOnly } from "@/shared/domain"
import type { SessionInput } from "../domain/types"

/** "Log watched together": the day, who was there and an optional note. */
export class SessionFormState {
  watchedOn = $state("")
  present = $state<string[]>([])
  note = $state("")

  constructor(private readonly today: () => DateOnly) {}

  /** Starts a fresh log for today with the given members ticked. */
  reset(present: readonly string[]): void {
    this.watchedOn = this.today()
    this.present = [...present]
    this.note = ""
  }

  isPresent = (id: string): boolean => this.present.includes(id)

  toggle(id: string, on: boolean): void {
    const others = this.present.filter((p) => p !== id)
    this.present = on ? [...others, id] : others
  }

  toInput(): SessionInput {
    return { watchedOn: this.watchedOn as DateOnly, memberIds: [...this.present], note: this.note }
  }
}
