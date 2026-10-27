import type { AppError } from "@/shared/domain"
import type { Playing, PlaybackService, ProviderSelection } from "../application/playback-service"
import type { EpisodeNumber, PlayTarget } from "../application/ports"
import type { PlaybackPrefs } from "../domain/provider.types"

export type PlayStatus = "idle" | "loading" | "ready" | "error"

/** One title's player: resolve sources on demand; a newer request supersedes an older one. */
export class PlayState {
  status = $state<PlayStatus>("idle")
  playing = $state<Playing | null>(null)
  error = $state<AppError | null>(null)
  private controller: AbortController | null = null

  constructor(
    private readonly service: PlaybackService,
    private readonly target: () => PlayTarget,
  ) {}

  async open(
    episode?: EpisodeNumber,
    prefs?: PlaybackPrefs,
    selection?: ProviderSelection,
  ): Promise<void> {
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    this.status = "loading"
    this.error = null
    const result = await this.service.play(
      this.target(),
      episode,
      prefs,
      controller.signal,
      selection,
    )
    if (this.controller !== controller) return
    if (result.ok) {
      this.playing = result.value
      this.status = "ready"
    } else {
      this.error = result.error
      this.status = "error"
    }
  }

  close(): void {
    this.controller?.abort()
    this.controller = null
    this.playing = null
    this.status = "idle"
  }
}
