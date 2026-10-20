// Test setup for the simkl service: the real client against a stub Simkl, and a MemoryStore.
// Not deployed.
import { MemoryStore, type MemoryRow } from "./memory-store.ts"
import { createSimklService } from "./service.ts"
import { createSimklClient } from "./simkl-client.ts"
import { STUB_BASE_URL, StubSimkl } from "./stub-simkl.ts"

export const NOW = new Date("2026-03-01T12:00:00Z")
export const DAY = 86_400_000
export const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString()

/** A connected row whose access token is good for `validMs` more. */
export const connected = (validMs = 3 * DAY, cursor: string | null = null): MemoryRow => ({
  accessToken: "simkl_at_old",
  refreshToken: "simkl_rt_one",
  accessExpiresAt: at(validMs),
  deviceCode: null,
  deviceExpiresAt: null,
  connected: true,
  cursor,
  lease: false,
  watches: [],
})

export function setup() {
  const stub = new StubSimkl()
  const store = new MemoryStore()
  const sleeps: number[] = []
  const client = createSimklClient({ clientId: "cid", baseUrl: STUB_BASE_URL, fetch: stub.fetch })
  const service = createSimklService({
    client,
    store,
    clock: () => NOW,
    sleep: async (ms) => {
      sleeps.push(ms)
      store.onWait?.()
    },
  })
  return { stub, store, service, sleeps }
}
