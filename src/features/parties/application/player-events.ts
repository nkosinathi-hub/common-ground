import { appError, err, ok, type Result } from "@/shared/domain"
import type { PartyCommand } from "../domain/party-machine"
import type { PlayerControl } from "./ports"

/** Rebind when fallback creates a new video; dispose both subscriptions together. */
export class PlayerEvents {
  private player: PlayerControl | null = null
  private cleanup: (() => void) | null = null
  bind(
    player: PlayerControl | null,
    buffering: (value: boolean) => void,
    action: (kind: PartyCommand, position: number) => void,
  ): void {
    if (player === this.player) return
    this.close()
    this.player = player
    const unbuffer = player?.onBuffering(buffering)
    const unaction = player?.onAction?.(action)
    this.cleanup = () => {
      unbuffer?.()
      unaction?.()
    }
  }
  close(): void {
    this.cleanup?.()
    this.cleanup = null
    this.player = null
  }
}

/** Keep the Ready gesture's play/pause events ordered before announcing readiness. */
export async function preparePlayer(player: PlayerControl | null): Promise<Result<void>> {
  if (!player) return ok(undefined)
  try {
    await player.play()
    player.pause()
    return ok(undefined)
  } catch {
    return err(appError("validation", "Tap the video to allow playback, then try Ready again"))
  }
}
