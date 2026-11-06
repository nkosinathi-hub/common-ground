/** Buffering is bounded; brief seeks get extra time, while pause and offline state never fail. */
export function watchMedia(
  video: HTMLVideoElement,
  onfail: () => void,
  timeoutMs = 20_000,
  onready: () => void = () => {},
) {
  let lastTime = video.currentTime
  let timer: ReturnType<typeof setTimeout> | undefined
  const clear = () => {
    clearTimeout(timer)
    timer = undefined
  }
  const waiting = () => {
    if (timer || video.paused || video.ended || navigator.onLine === false) return
    const position = video.currentTime
    timer = setTimeout(
      () => {
        timer = undefined
        if (
          !video.paused &&
          !video.ended &&
          navigator.onLine !== false &&
          video.currentTime <= position + 0.1
        )
          onfail()
      },
      video.seeking ? timeoutMs * 2 : timeoutMs,
    )
  }
  const progress = () => {
    if (Math.abs(video.currentTime - lastTime) > 0.1) {
      lastTime = video.currentTime
      clear()
    }
    if (video.readyState < 3) waiting()
  }
  video.addEventListener("waiting", waiting)
  video.addEventListener("stalled", waiting)
  const ready = () => {
    clear()
    onready()
  }
  video.addEventListener("playing", ready)
  video.addEventListener("timeupdate", progress)
  video.addEventListener("pause", clear)
  return () => {
    clear()
    video.removeEventListener("waiting", waiting)
    video.removeEventListener("stalled", waiting)
    video.removeEventListener("playing", ready)
    video.removeEventListener("timeupdate", progress)
    video.removeEventListener("pause", clear)
  }
}
