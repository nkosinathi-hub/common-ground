import { appError, err, ok, type Result } from "../../../shared/domain/result"
import { matchesAny } from "./origin-policy"
import type { SecurityPolicy } from "./plugin.types"
import type { PlayableSource } from "./source.types"

const TOKEN_PARAM = /[?&](api_?key|access_?token|token|x-emby-token|x-mediabrowser-token)=/i

const refuse = (field: string, message: string) => err(appError("validation", message, field))

/**
 * A source passes only on the policy of the provider that returned it: embeds against its
 * frame origins, everything else against its media origins. Tokens never travel in a URL.
 */
export function validateSource(
  source: PlayableSource,
  policy: SecurityPolicy,
): Result<PlayableSource> {
  const allowed = source.kind === "embed" ? policy.frames : policy.media
  if (!matchesAny(source.url, allowed)) return refuse("url", `${source.url} is outside the policy`)
  if (TOKEN_PARAM.test(source.url)) return refuse("url", "a credential sits in the URL")
  const textOrigins = [...policy.subtitles, ...policy.media]
  const strayTrack = source.subtitles.find((track) => !matchesAny(track.url, textOrigins))
  if (strayTrack) return refuse("subtitles", `${strayTrack.url} is outside the policy`)
  const broken = source.segments.find((s) => !(s.start >= 0 && s.end > s.start))
  if (broken) return refuse("segments", `${broken.kind} segment has no positive length`)
  if (source.kind !== "embed") return ok(source)
  return ok({ ...source, sandbox: [...policy.sandbox] })
}
