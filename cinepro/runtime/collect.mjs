const english = (result) =>
  result.some((r) =>
    r.sources?.some((source) =>
      source.audioTracks?.some((track) => /^(en(?:-|$)|eng$|english$)/i.test(track.language ?? "")),
    ),
  )

/** Return validated English results promptly; otherwise retain fallbacks up to the budget. */
export function collect(jobs, { timeoutMs = 12000, settleMs = 350 } = {}) {
  if (!jobs.length) return Promise.resolve([])
  return new Promise((resolve) => {
    const controller = new AbortController()
    const found = []
    let remaining = jobs.length
    let done = false
    let settle
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(deadline)
      clearTimeout(settle)
      controller.abort()
      resolve(found.flat())
    }
    const deadline = setTimeout(finish, timeoutMs)
    for (const job of jobs)
      void Promise.resolve()
        .then(() => job(controller.signal))
        .catch(() => [])
        .then((result) => {
          if (done) return
          found.push(result)
          if (!settle && english(result)) settle = setTimeout(finish, settleMs)
          if (--remaining === 0) finish()
        })
  })
}
