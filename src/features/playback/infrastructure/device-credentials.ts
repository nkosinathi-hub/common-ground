import type { Credential, CredentialStore } from "../domain/plugin.types"

/** Async key-value storage on this device: Capacitor Preferences, or the web device store. */
export interface KeyValue {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

const PREFIX = "playback-credential:"

function parse(raw: string | null): Credential | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Credential>
    const fields = [value.token, value.userId, value.deviceId]
    return fields.every((f) => typeof f === "string") ? (value as Credential) : null
  } catch {
    return null
  }
}

/** Provider tokens stay on the device; they are never sent to Supabase. */
export class DeviceCredentials implements CredentialStore {
  constructor(private readonly kv: KeyValue) {}

  async get(providerId: string): Promise<Credential | null> {
    return parse(await this.kv.get(PREFIX + providerId))
  }

  async set(providerId: string, credential: Credential): Promise<void> {
    await this.kv.set(PREFIX + providerId, JSON.stringify(credential))
  }

  async clear(providerId: string): Promise<void> {
    await this.kv.remove(PREFIX + providerId)
  }
}
