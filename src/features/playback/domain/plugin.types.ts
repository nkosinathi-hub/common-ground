import type { AppError, Result } from "../../../shared/domain/result"
import type { MediaRef } from "./media-ref"
import type { ErrorClass, Provider } from "./provider.types"
import type { SourceKind } from "./source.types"

export type SandboxToken =
  "allow-scripts" | "allow-same-origin" | "allow-presentation" | "allow-popups"

/** Exact https origins (or one subdomain wildcard level) a plugin may use, per CSP directive. */
export interface SecurityPolicy {
  readonly connect: readonly string[]
  readonly media: readonly string[]
  readonly frames: readonly string[]
  readonly subtitles: readonly string[]
  readonly sandbox: readonly SandboxToken[]
}

export interface Capabilities {
  readonly media: readonly MediaRef["kind"][]
  readonly sources: readonly SourceKind[]
  readonly credentials: boolean
  readonly health: boolean
}

export interface LogEntry {
  readonly providerId: string
  readonly outcome: "ok" | "error" | "timeout" | "rejected" | "skipped" | "mismatch"
  readonly ms: number
  readonly reason?: string
}

export interface PlaybackLog {
  record(entry: LogEntry): void
}

export interface Credential {
  readonly token: string
  readonly userId: string
  readonly deviceId: string
}

/** Per-user secrets, kept on this device only (never in Supabase). */
export interface CredentialStore {
  get(providerId: string): Promise<Credential | null>
  set(providerId: string, credential: Credential): Promise<void>
  clear(providerId: string): Promise<void>
}

export interface Trailer {
  readonly key: string
  readonly site: string
  readonly type: string
  readonly official: boolean
}

/** TMDB metadata the plugins share: external ids and official videos. */
export interface TmdbLookup {
  imdbId(ref: MediaRef, signal: AbortSignal): Promise<Result<string | null>>
  videos(ref: MediaRef, signal: AbortSignal): Promise<Result<Trailer[]>>
}

export interface PluginDeps {
  readonly id: string
  readonly fetch: typeof fetch
  readonly clock: () => number
  readonly log: PlaybackLog
  readonly credentials: CredentialStore
  readonly tmdb: TmdbLookup
}

/** One adapter module exports one of these; docs/playback-plugins.md describes each field. */
export interface ProviderPlugin<O = unknown> {
  readonly type: string
  validateOptions(raw: unknown): Result<O>
  readonly capabilities: Capabilities
  readonly security: SecurityPolicy
  create(options: O, deps: PluginDeps): Provider
  classifyError(error: AppError): ErrorClass
  detectFormat?(url: string, contentType?: string): SourceKind | null
}
