import type { DeviceStore } from "@/shared/domain"

const KEY = "playback-device-id"

/** A stable random id for this device, so a media server can revoke just this session. */
export function deviceId(store: DeviceStore): string {
  const known = store.read(KEY)
  if (known) return known
  const fresh = crypto.randomUUID()
  store.write(KEY, fresh)
  return fresh
}
