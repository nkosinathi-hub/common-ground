import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import type { MediaRef } from "../../domain/media-ref"

/**
 * One curated title: a TMDB movie, or a TMDB series' episode, and the PeerTube video holding it.
 * `licence` records the licence the publisher states for the work, for videos whose PeerTube
 * metadata leaves it unset; without it the instance's own licence field must be an open one.
 */
export interface PeerTubeTitle {
  readonly tmdbId: number
  readonly season?: number
  readonly episode?: number
  readonly episodeTmdbId?: number
  readonly video: string
  readonly licence?: string
}

export interface PeerTubeOptions {
  readonly titles: readonly PeerTubeTitle[]
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SHORT_UUID = /^[1-9A-HJ-NP-Za-km-z]{20,24}$/
/** Creative Commons licences and public-domain tools only; nothing implied. */
const OPEN_LICENCE = /^https:\/\/creativecommons\.org\/(publicdomain|licenses)\/[a-z0-9./-]+$/i

const counting = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 1
const bad = (index: number, message: string) =>
  err(appError("validation", `titles[${index}]: ${message}`, "titles"))

function checkTitle(raw: unknown, index: number): Result<PeerTubeTitle> {
  const t = (raw ?? {}) as Record<string, unknown>
  if (!counting(t.tmdbId)) return bad(index, "tmdbId must be a TMDB id")
  if (typeof t.video !== "string" || !(UUID.test(t.video) || SHORT_UUID.test(t.video)))
    return bad(index, "video must be a PeerTube uuid or short uuid")
  const isEpisode = t.season !== undefined || t.episode !== undefined
  if (isEpisode && !(counting(t.season) && counting(t.episode)))
    return bad(index, "an episode needs season and episode from 1 (specials are not played)")
  if (t.episodeTmdbId !== undefined && !(isEpisode && counting(t.episodeTmdbId)))
    return bad(index, "episodeTmdbId belongs to an episode and must be a TMDB id")
  if (t.licence !== undefined && !(typeof t.licence === "string" && OPEN_LICENCE.test(t.licence)))
    return bad(index, "licence must be a creativecommons.org licence or public-domain URL")
  return ok(t as unknown as PeerTubeTitle)
}

/** Options are the curated title list; every entry is checked, and the first fault is named. */
export function validatePeerTubeOptions(raw: unknown): Result<PeerTubeOptions> {
  const titles = (raw as { titles?: unknown } | null)?.titles
  if (!Array.isArray(titles) || titles.length === 0)
    return err(appError("validation", "titles must be a non-empty list", "titles"))
  const checked: PeerTubeTitle[] = []
  for (const [index, raw] of titles.entries()) {
    const title = checkTitle(raw, index)
    if (!title.ok) return title
    checked.push(title.value)
  }
  return ok({ titles: checked })
}

/**
 * The title for a ref. A movie matches its TMDB id with no season. An episode matches TMDB's own
 * episode id first, when both sides know it, then the series id with season and number.
 */
export function findTitle(
  titles: readonly PeerTubeTitle[],
  ref: MediaRef,
): PeerTubeTitle | undefined {
  if (ref.kind === "movie")
    return titles.find((t) => t.tmdbId === ref.tmdbId && t.season === undefined)
  const series = titles.filter((t) => t.tmdbId === ref.tmdbId && t.season !== undefined)
  const byId = ref.episodeTmdbId
    ? series.find((t) => t.episodeTmdbId === ref.episodeTmdbId)
    : undefined
  return byId ?? series.find((t) => t.season === ref.season && t.episode === ref.episode)
}
