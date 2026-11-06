/** A paused, decoded video has a pause to preserve; initial loading and media errors do not. */
export function pauseToPreserve(video: HTMLVideoElement | null, paused: boolean): boolean {
  return !!(video && paused && video.currentTime > 0 && video.readyState >= 2 && !video.error)
}

/** Observe actual progress: decoders can freeze with readyState 4 and emit no waiting event. */
export function watchMedia(
  video: HTMLVideoElement,
  onfail: () => void,
  timeoutMs = 20_000,
  onready: () => void = () => {},
) {
  let lastTime = video.currentTime
  let lastProgress = Date.now()
  let failed = false
  const reset = () => {
    lastTime = video.currentTime
    lastProgress = Date.now()
  }
  const check = () => {
    if (failed) return
    if (
      video.paused ||
      video.ended ||
      navigator.onLine === false ||
      Math.abs(video.currentTime - lastTime) > 0.1
    )
      return reset()
    if (Date.now() - lastProgress < timeoutMs * (video.seeking ? 2 : 1)) return
    failed = true
    onfail()
  }
  const ready = () => {
    reset()
    onready()
  }
  const timer = setInterval(check, Math.min(2000, timeoutMs / 4))
  video.addEventListener("playing", ready)
  video.addEventListener("timeupdate", check)
  video.addEventListener("pause", reset)
  video.addEventListener("seeking", reset)
  return () => {
    clearInterval(timer)
    video.removeEventListener("playing", ready)
    video.removeEventListener("timeupdate", check)
    video.removeEventListener("pause", reset)
    video.removeEventListener("seeking", reset)
  }
}
