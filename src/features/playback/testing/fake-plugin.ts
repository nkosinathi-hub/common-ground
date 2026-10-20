import { ok, type Result } from "../../../shared/domain/result"
import { defaultClassify } from "../domain/errors"
import type { MediaRef } from "../domain/media-ref"
import type {
  Credential,
  CredentialStore,
  LogEntry,
  PluginDeps,
  ProviderPlugin,
  SecurityPolicy,
} from "../domain/plugin.types"
import { EMPTY_POLICY } from "../domain/policy"
import type { ProviderConfig } from "../domain/provider.types"
import type { PlayableSource } from "../domain/source.types"

type Resolve = (ref: MediaRef, signal: AbortSignal) => Promise<Result<PlayableSource[]>>

export interface FakeBehaviour {
  readonly resolve?: Resolve
  readonly health?: () => Promise<Result<void>>
  readonly security?: Partial<SecurityPolicy>
  readonly probe?: boolean
}

/** A test-only plugin whose provider answers however the test says. */
export function fakePlugin(type: string, behaviour: FakeBehaviour = {}): ProviderPlugin<null> {
  return {
    type,
    validateOptions: () => ok(null),
    capabilities: {
      media: ["movie", "episode"],
      sources: ["hls", "dash", "file", "embed"],
      credentials: false,
      health: behaviour.probe ?? true,
    },
    security: { ...EMPTY_POLICY, media: [`https://${type}.example.org`], ...behaviour.security },
    classifyError: defaultClassify,
    create: (_options, deps) => ({
      id: deps.id,
      supports: () => true,
      resolve: behaviour.resolve ?? (async () => ok([fakeSource(type, deps.id)])),
      health: behaviour.health ?? (async () => ok(undefined)),
    }),
  }
}

export const fakeSource = (type: string, providerId: string, quality?: number): PlayableSource => ({
  kind: "hls",
  url: `https://${type}.example.org/${providerId}/master.m3u8`,
  subtitles: [],
  segments: [],
  providerId,
  ...(quality === undefined ? {} : { quality }),
})

export const config = (type: string, extra: Partial<ProviderConfig> = {}): ProviderConfig => ({
  type,
  id: type,
  enabled: true,
  priority: 1,
  timeoutMs: 1_000,
  retries: 0,
  options: null,
  ...extra,
})

export class RecordingLog {
  readonly entries: LogEntry[] = []
  record(entry: LogEntry): void {
    this.entries.push(entry)
  }
}

export class MemoryCredentials implements CredentialStore {
  readonly saved = new Map<string, Credential>()
  async get(id: string) {
    return this.saved.get(id) ?? null
  }
  async set(id: string, credential: Credential) {
    this.saved.set(id, credential)
  }
  async clear(id: string) {
    this.saved.delete(id)
  }
}

export function fakeDeps(fetcher: typeof fetch = fetch): Omit<PluginDeps, "id"> {
  return {
    fetch: fetcher,
    clock: () => Date.now(),
    log: new RecordingLog(),
    credentials: new MemoryCredentials(),
    tmdb: { imdbId: async () => ok(null), videos: async () => ok([]) },
  }
}
