import type { PlayableSource } from "../domain/source.types"

/** Keep a short window for fallbacks after playable media arrives; stop straggling lookups. */
export function gatherSources(
  jobs: readonly ((signal: AbortSignal) => Promise<PlayableSource[]>)[],
  canPlay: (source: PlayableSource) => boolean,
  parent?: AbortSignal,
  settleMs = 400,
): Promise<PlayableSource[]> {
  if (!jobs.length || parent?.aborted) return Promise.resolve([])
  return new Promise((resolve) => {
    const controller = new AbortController()
    const sources: PlayableSource[] = []
    let remaining = jobs.length
    let timer: ReturnType<typeof setTimeout> | undefined
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      parent?.removeEventListener("abort", finish)
      controller.abort()
      resolve(sources)
    }
    parent?.addEventListener("abort", finish, { once: true })
    for (const job of jobs)
      void Promise.resolve()
        .then(() => job(controller.signal))
        .catch(() => [])
        .then((found) => {
          if (done) return
          sources.push(...found)
          if (!timer && found.some(canPlay)) timer = setTimeout(finish, settleMs)
          if (--remaining === 0) finish()
        })
  })
}
