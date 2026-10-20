// Test setup for the simkl service: a MemoryStore and a scripted Simkl client. Not deployed.
import { MemoryStore } from "./memory-store.ts"
import { createSimklService } from "./service.ts"
import type { SimklClient, SimklResult } from "./simkl-client.ts"

export const ok = (body: unknown): SimklResult => ({ ok: true, body })
export const NOW = new Date("2026-03-01T12:00:00Z")

/** Replies the default client gives; tests may change them between calls. */
interface Script {
  pollPin: SimklResult
}

/** A service whose client records every call as its arguments; override any call. */
export function setup(overrides: Partial<SimklClient> = {}) {
  const script: Script = { pollPin: ok({ result: "KO", message: "Authorization pending" }) }
  const calls: Record<keyof SimklClient, unknown[][]> = {
    startPin: [],
    pollPin: [],
    activities: [],
    allItems: [],
  }
  const defaults: SimklClient = {
    startPin: async () =>
      ok({ result: "OK", user_code: "ABCDE", verification_url: "https://simkl.com/pin" }),
    pollPin: async () => script.pollPin,
    activities: async () => ok({ all: "2026-02-01T00:00:00Z" }),
    allItems: async () => ok(null),
  }
  const merged = { ...defaults, ...overrides }
  const client: SimklClient = {
    startPin: () => (calls.startPin.push([]), merged.startPin()),
    pollPin: (code) => (calls.pollPin.push([code]), merged.pollPin(code)),
    activities: (token) => (calls.activities.push([token]), merged.activities(token)),
    allItems: (token, kind, from) => (
      calls.allItems.push([token, kind, from]),
      merged.allItems(token, kind, from)
    ),
  }
  const store = new MemoryStore()
  const service = createSimklService({ client, store, clock: () => NOW })
  return { calls, script, store, service }
}
