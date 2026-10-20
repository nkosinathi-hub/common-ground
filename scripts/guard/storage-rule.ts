export interface StorageViolation {
  readonly path: string
  readonly reason: string
}

const OWNER = "src/shared/ui/device-store.ts"
const APP_CODE = /^src\/.+\.(ts|svelte)$/
const TEST = /\.test\.ts$/
const WEB_STORAGE = /\b(localStorage|sessionStorage)\b/

/** Web storage goes through the device store, which prefixes every key so sign-out clears it. */
export function checkStorage(path: string, text: string): StorageViolation[] {
  if (!APP_CODE.test(path) || TEST.test(path) || path === OWNER) return []
  return WEB_STORAGE.test(text) ? [{ path, reason: `use deviceStore() from ${OWNER}` }] : []
}
