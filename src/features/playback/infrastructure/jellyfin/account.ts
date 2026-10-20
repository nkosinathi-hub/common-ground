import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import type { CredentialStore } from "../../domain/plugin.types"
import { requestJson } from "../http"
import { authorization, JellyfinSession } from "./client"
import { itemsOf, type JellyfinItem } from "./items"
import { findTitle } from "./lookup"

export interface AccountDeps {
  readonly origin: string
  readonly fetch: typeof fetch
  readonly credentials: CredentialStore
  readonly providerId: string
}

export interface NextEpisode {
  readonly season: number
  readonly episode: number
  readonly title: string
}

/** The signed-in Jellyfin user on this device: sign in, sign out (revoking), and NextUp. */
export class JellyfinAccount {
  private readonly cache = new Map<string, JellyfinItem>()

  constructor(private readonly deps: AccountDeps) {}

  private async session(): Promise<JellyfinSession | null> {
    const credential = await this.deps.credentials.get(this.deps.providerId)
    return credential ? new JellyfinSession(this.deps.origin, this.deps.fetch, credential) : null
  }

  async signedIn(): Promise<boolean> {
    return (await this.session()) !== null
  }

  async signIn(username: string, password: string, deviceId: string): Promise<Result<void>> {
    const reply = await requestJson(this.deps.fetch, {
      url: `${this.deps.origin}/Users/AuthenticateByName`,
      method: "POST",
      headers: { Authorization: authorization(deviceId) },
      body: { Username: username, Pw: password },
    })
    if (!reply.ok) return reply
    const body = reply.value as { AccessToken?: unknown; User?: { Id?: unknown } }
    if (typeof body.AccessToken !== "string" || typeof body.User?.Id !== "string")
      return err(appError("unknown", "Jellyfin did not return a session"))
    const credential = { token: body.AccessToken, userId: body.User.Id, deviceId }
    await this.deps.credentials.set(this.deps.providerId, credential)
    return ok(undefined)
  }

  /** Revokes the device's session on the server first, then forgets the token either way. */
  async signOut(): Promise<void> {
    const session = await this.session()
    if (session) await session.send("/Sessions/Logout", {}, true)
    await this.deps.credentials.clear(this.deps.providerId)
  }

  /** The user's next episode of a series by its TMDB id, from Jellyfin's NextUp. */
  async nextUp(tmdbId: number, signal?: AbortSignal): Promise<Result<NextEpisode | null>> {
    const session = await this.session()
    if (!session) return err(appError("unauthenticated", "Sign in to Jellyfin"))
    const ref = { kind: "episode", tmdbId, season: 1, episode: 1 } as const
    const series = await findTitle(session, ref, this.cache, signal ?? new AbortController().signal)
    if (!series.ok) return series
    const query = { userId: session.credential.userId, seriesId: series.value.Id, limit: 1 }
    const reply = await session.get("/Shows/NextUp", query, signal)
    if (!reply.ok) return reply
    const next = itemsOf(reply.value)[0]
    if (next?.ParentIndexNumber === undefined || next.IndexNumber === undefined) return ok(null)
    const title = next.Name ?? ""
    return ok({ season: next.ParentIndexNumber, episode: next.IndexNumber, title })
  }
}
