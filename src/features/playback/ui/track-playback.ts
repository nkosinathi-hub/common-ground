import type { ProgressReporter } from "../application/progress-reporter"
import type { KeyAction } from "./player-logic"

type Lock = { release(): Promise<void> }

/** Keeps the screen awake while playing, where the Screen Wake Lock API exists. */
async function wakeLock(): Promise<Lock | null> {
  const api = (navigator as { wakeLock?: { request(type: "screen"): Promise<Lock> } }).wakeLock
  try {
    return (await api?.request("screen")) ?? null
  } catch {
    return null
  }
}

/**
 * Wires a media element to the progress reporter: start on first play, a tick on every time
 * update (the reporter sends at most every 10 s), and a keepalive stop on pagehide.
 */
export function trackPlayback(video: HTMLVideoElement, reporter: ProgressReporter): () => void {
  let started = false
  let lock: Lock | null = null
  const release = () => void lock?.release().catch(() => {})
  const onPlay = async () => {
    if (!started) await reporter.start(video.currentTime)
    started = true
    lock = await wakeLock()
  }
  const onTime = () => void reporter.tick(video.currentTime, video.duration, video.paused)
  const onHide = () => void reporter.stop(video.currentTime, true)
  const listeners: [EventTarget, string, () => unknown][] = [
    [video, "play", onPlay],
    [video, "timeupdate", onTime],
    [video, "pause", release],
    [video, "ended", release],
    [window, "pagehide", onHide],
  ]
  for (const [target, name, fn] of listeners) target.addEventListener(name, fn)
  return () => {
    for (const [target, name, fn] of listeners) target.removeEventListener(name, fn)
    release()
    if (started) void reporter.stop(video.currentTime, false)
  }
}

export interface KeyContext {
  readonly video: HTMLVideoElement | null
  readonly container: HTMLElement | null
  readonly toggleCaptions: () => void
}

/** Applies a player shortcut. Fullscreen takes the whole player, so overlays stay visible. */
export function applyKey(action: KeyAction, ctx: KeyContext): void {
  const { video, container } = ctx
  if (action === "captions") return ctx.toggleCaptions()
  if (action === "fullscreen") {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void container?.requestFullscreen?.()
    return
  }
  if (!video) return
  if (action === "toggle") {
    if (video.paused) void video.play()
    else video.pause()
  } else if (action === "mute") video.muted = !video.muted
  else video.currentTime = Math.max(0, video.currentTime + (action === "back" ? -10 : 10))
}
