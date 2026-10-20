import type { SimklStore } from "./ports.ts"
import type { SimklClient } from "./simkl-client.ts"

/** What the simkl service runs on; the Deno entry wires the real ones. */
export interface SimklDeps {
  readonly client: SimklClient
  readonly store: SimklStore
  readonly clock: () => Date
  /** Waits between reads while another sync refreshes the token. */
  readonly sleep: (ms: number) => Promise<void>
}
