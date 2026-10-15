import { err, isDateOnly, ok, appError, type DateOnly, type Result } from "@/shared/domain"
import type { Progress, ProgressInput, ProgressStatus } from "../domain/types"
import { parseCount } from "../domain/validation"

/** Text inputs for "my progress". Numbers stay as typed until submit so nothing is lost. */
export class ProgressFormState {
  status = $state<ProgressStatus>("not_started")
  season = $state("")
  episode = $state("")
  rating = $state("")
  completedOn = $state("")

  constructor(private readonly today: () => DateOnly) {}

  reset(p: Progress | null): void {
    this.status = p?.status ?? "not_started"
    this.season = p?.season?.toString() ?? ""
    this.episode = p?.episode?.toString() ?? ""
    this.rating = p?.rating?.toString() ?? ""
    this.completedOn = p?.completedOn ?? ""
  }

  /** Choosing "completed" fills today's date if none was set. */
  setStatus(status: ProgressStatus): void {
    this.status = status
    if (status === "completed" && this.completedOn === "") this.completedOn = this.today()
  }

  toInput(): Result<ProgressInput> {
    const season = parseCount(this.season, "season")
    if (!season.ok) return season
    const episode = parseCount(this.episode, "episode")
    if (!episode.ok) return episode
    const rating = this.rating === "" ? null : Number(this.rating)
    const day = this.completedOn.trim()
    if (this.status === "completed" && day !== "" && !isDateOnly(day))
      return err(appError("validation", "Use a date like 2026-10-15", "completedOn"))
    return ok({
      status: this.status,
      season: season.value,
      episode: episode.value,
      rating,
      completedOn: this.status === "completed" && day !== "" ? (day as DateOnly) : null,
    })
  }
}
