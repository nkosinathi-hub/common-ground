import { success, type Outcome } from "../http/outcome.ts"
import type { SimklDeps } from "./deps.ts"
import { pollDevice, startDevice, type DeviceStart, type PollStatus } from "./device.ts"
import { syncUser, type SyncResult } from "./sync.ts"

export interface SimklService {
  pin(userId: string): Promise<Outcome<DeviceStart>>
  /** `interval` is the browser's current poll interval, returned grown by five on slow_down. */
  poll(userId: string, interval: number): Promise<Outcome<PollStatus>>
  sync(userId: string): Promise<Outcome<SyncResult>>
  disconnect(userId: string): Promise<Outcome<{ connected: false }>>
}

export function createSimklService(deps: SimklDeps): SimklService {
  return {
    pin: (userId) => startDevice(deps, userId),
    poll: (userId, interval) => pollDevice(deps, userId, interval),
    sync: (userId) => syncUser(deps, userId),

    /** Revokes the grant (either token revokes both), then forgets the row whatever Simkl says. */
    async disconnect(userId) {
      const link = await deps.store.link(userId)
      const token = link?.refreshToken ?? link?.accessToken
      if (token) await deps.client.revoke(token)
      await deps.store.remove(userId)
      return success({ connected: false as const })
    },
  }
}
