import { AsyncLocalStorage } from "node:async_hooks"
import { collect } from "./collect.mjs"

const INSTALLED = Symbol.for("common-ground.cinepro.runtime.v1")

/** Wrap the pinned framework once, without editing its bundled files or bypassing validation. */
export function install(SourceService, options = {}) {
  const prototype = SourceService.prototype
  if (prototype[INSTALLED]) return
  if (typeof prototype.fetchFromProviders !== "function")
    throw new Error("Unsupported CinePro framework: missing provider aggregation")
  const scope = new AsyncLocalStorage()
  const target = options.fetchTarget ?? globalThis
  const originalFetch = target.fetch.bind(target)
  target.fetch = (input, init) => {
    const signal = scope.getStore()
    if (!signal) return originalFetch(input, init)
    const parent = init?.signal ?? (input instanceof Request ? input.signal : null)
    return originalFetch(input, {
      ...init,
      signal: parent ? AbortSignal.any([signal, parent]) : signal,
    })
  }
  const original = prototype.fetchFromProviders
  prototype.fetchFromProviders = function (type, media) {
    const providers = this.registry
      .getProviders()
      .filter(
        (p) =>
          p.enabled &&
          p.capabilities.supportedContentTypes.includes(type === "movie" ? "movies" : "tv"),
      )
    return collect(
      providers.map((provider) => (signal) => {
        const isolated = Object.create(this)
        isolated.registry = { getProviders: () => [provider] }
        return scope.run(signal, () => original.call(isolated, type, media))
      }),
      options,
    )
  }
  const requests = new WeakMap()
  for (const method of ["getMovieSources", "getTVSources"]) {
    const fetchSources = prototype[method]
    prototype[method] = function (...args) {
      let pending = requests.get(this)
      if (!pending) {
        pending = new Map()
        requests.set(this, pending)
      }
      const key = `${method}:${JSON.stringify(args)}`
      if (!pending.has(key))
        pending.set(
          key,
          Promise.resolve()
            .then(() => fetchSources.apply(this, args))
            .finally(() => pending.delete(key)),
        )
      return pending.get(key)
    }
  }
  Object.defineProperty(prototype, INSTALLED, { value: true })
}
