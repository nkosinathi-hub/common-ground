import { withTimeout } from "./with-timeout"
import { episodeRef } from "../domain/media-ref"
import type { PlayableSource } from "../domain/source.types"
import type { SourceResolver } from "./source-resolver"
import type { PlayTarget } from "./ports"
import type { Playing } from "./playing"
import { ok, type Result } from "../../../shared/domain/result"

/** Invalidate signed links, then resolve through the same policy validation and ranking. */
export async function refreshPlayback(
  resolver: Pick<SourceResolver, "resolve" | "providerFor">,
  target: PlayTarget,
  playing: Playing,
  source: PlayableSource,
  signal: AbortSignal,
): Promise<Result<Playing>> {
  const provider = resolver.providerFor(source)
  if (provider?.refresh) {
    const { result: refreshed } = await withTimeout(
      (attempt) => provider.refresh!(source, attempt),
      8_000,
      signal,
    )
    if (!refreshed.ok && refreshed.error.kind !== "not_found") return refreshed
  }
  const ref =
    playing.ref.kind === "episode"
      ? episodeRef(target.catalog.id, playing.ref.season, playing.ref.episode)
      : ok(playing.ref)
  if (!ref.ok) return ref
  const found = await resolver.resolve(ref.value, {
    signal,
    excludeProviderIds: ["youtube-trailer"],
  })
  return found.ok
    ? ok({ ref: ref.value, sources: [found.value.best, ...found.value.fallbacks] })
    : found
}
