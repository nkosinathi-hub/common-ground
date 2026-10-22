import { ACTIVE_PARTY, activeParty, local, onStorageChange } from "./chrome-storage"
import { playParty } from "./content-party"
import { titleIdFrom } from "./netflix-title"

/**
 * The content script on netflix.com. Netflix moves between pages without reloading, so it checks
 * the address each second and plays the joined party only on a watch page (/watch/<id>). It reads
 * and drives the member's own player; it never touches Netflix's media requests or decryption.
 */
let current: { partyId: string; leave: Promise<() => void> } | null = null

async function sync(force = false): Promise<void> {
  const titleId = () => titleIdFrom(location.pathname)
  const partyId = titleId() ? await activeParty(local()) : null
  if (!force && (current?.partyId ?? null) === partyId) return
  const previous = current
  current = partyId
    ? { partyId, leave: playParty(partyId, { doc: document, win: window, titleId }) }
    : null
  if (previous) (await previous.leave)()
}

onStorageChange((keys) => {
  if (keys.includes(ACTIVE_PARTY)) void sync(true)
})
setInterval(() => void sync(), 1000)
void sync()
