import type { PinStart, SimklLink } from "./types"

/** Where the Account card's Simkl connection stands; `note` is the latest outcome to show. */
export type ConnectionState =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "disconnected"; readonly note?: string }
  | { readonly kind: "pending"; readonly pin: PinStart; readonly note?: string }
  | { readonly kind: "connected"; readonly link: SimklLink; readonly note?: string }

export const EXPIRED = "The code expired. Connect again for a new one"

/** What one sync brought in, in words. */
export const addedNote = (added: number): string =>
  added === 0
    ? "Nothing new from Simkl"
    : `Added ${added} ${added === 1 ? "watch" : "watches"} from Simkl`
