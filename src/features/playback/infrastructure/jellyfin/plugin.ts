import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import { defaultClassify } from "../../domain/errors"
import { checkPattern } from "../../domain/origin-policy"
import type { ProviderPlugin } from "../../domain/plugin.types"
import { EMPTY_POLICY } from "../../domain/policy"
import { requestOk } from "../http"
import { openSession } from "./client"
import type { CodecProbe } from "./device-profile"
import type { JellyfinItem } from "./items"
import { reportJellyfin } from "./report"
import { resolveJellyfin } from "./resolve"

export interface JellyfinOptions {
  readonly serverUrl: string
}

const bare = (url: string) => url.replace(/\/+$/, "")

function validate(origin: string, raw: unknown): Result<JellyfinOptions> {
  const serverUrl = (raw as Partial<JellyfinOptions> | null)?.serverUrl
  if (typeof serverUrl !== "string" || bare(serverUrl) !== origin)
    return err(appError("validation", `Jellyfin must be ${origin}, the server this build allows`))
  return ok({ serverUrl: origin })
}

/**
 * Jellyfin, for media the household owns. Its origin is fixed at build time
 * (VITE_JELLYFIN_ORIGIN), so the CSP and this policy name the same single server.
 */
export function jellyfinPlugin(origin: string, probe: CodecProbe): ProviderPlugin<JellyfinOptions> {
  const server = bare(origin)
  if (checkPattern(server, { allowLoopback: true }) || server.includes("*"))
    throw new Error(`VITE_JELLYFIN_ORIGIN "${origin}" must be one exact https origin`)
  return {
    type: "jellyfin",
    validateOptions: (raw) => validate(server, raw),
    capabilities: {
      media: ["movie", "episode"],
      sources: ["file", "hls"],
      credentials: true,
      health: true,
    },
    security: { ...EMPTY_POLICY, connect: [server], media: [server], subtitles: [server] },
    classifyError: defaultClassify,
    create: (options, deps) => {
      const cache = new Map<string, JellyfinItem>()
      const resolveDeps = { providerId: deps.id, probe, log: deps.log, cache }
      return {
        id: deps.id,
        supports: () => true,
        resolve: async (ref, signal, prefs) => {
          const session = await openSession(deps, options.serverUrl)
          if (!session.ok) return session
          return resolveJellyfin(session.value, ref, resolveDeps, signal, prefs)
        },
        health: (signal) =>
          requestOk(deps.fetch, { url: `${options.serverUrl}/System/Info/Public`, signal }),
        report: async (event) => {
          const session = await openSession(deps, options.serverUrl)
          if (session.ok) await reportJellyfin(session.value, event)
        },
      }
    },
  }
}
