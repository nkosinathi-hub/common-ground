import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import { defaultClassify } from "../../domain/errors"
import type { MediaRef } from "../../domain/media-ref"
import type { PluginDeps, ProviderPlugin } from "../../domain/plugin.types"
import type { PlayableSource } from "../../domain/source.types"
import { archiveIds, openItem, type ArchiveEndpoints, type ArchiveItem } from "./lookup"

const ARCHIVE: ArchiveEndpoints = {
  wikidata: "https://query.wikidata.org/sparql",
  archive: "https://archive.org",
  media: ["https://archive.org", "https://*.us.archive.org"],
}

const originOf = (url: string) => new URL(url).origin

function sourcesFor(item: ArchiveItem, endpoints: ArchiveEndpoints, providerId: string) {
  const common = { subtitles: [], segments: [], providerId }
  const file: PlayableSource[] = item.mp4
    ? [
        {
          kind: "file",
          url: `${endpoints.archive}/download/${item.id}/${encodeURIComponent(item.mp4)}`,
          mime: "video/mp4",
          ...common,
        },
      ]
    : []
  return [
    ...file,
    { kind: "embed", url: `${endpoints.archive}/embed/${item.id}`, ...common } as const,
  ]
}

async function resolve(
  deps: PluginDeps,
  endpoints: ArchiveEndpoints,
  ref: MediaRef,
  signal: AbortSignal,
): Promise<Result<PlayableSource[]>> {
  const imdb = await deps.tmdb.imdbId(ref, signal)
  if (!imdb.ok) return imdb
  if (!imdb.value) return err(appError("not_found", "No IMDb id for this title"))
  const ids = await archiveIds(deps.fetch, endpoints, imdb.value, signal)
  if (!ids.ok) return ids
  for (const id of ids.value) {
    const item = await openItem(deps.fetch, endpoints, id, signal)
    if (item.ok) return ok(sourcesFor(item.value, endpoints, deps.id))
  }
  return err(appError("not_found", "No openly licensed copy on the Internet Archive"))
}

/** Public-domain and Creative Commons films from the Internet Archive; no credentials. */
export function internetArchivePlugin(endpoints: ArchiveEndpoints = ARCHIVE): ProviderPlugin<null> {
  const archive = originOf(endpoints.archive)
  return {
    type: "internet-archive",
    validateOptions: () => ok(null),
    capabilities: {
      media: ["movie"],
      sources: ["file", "embed"],
      credentials: false,
      health: false,
    },
    security: {
      connect: [originOf(endpoints.wikidata), archive],
      media: [...endpoints.media],
      frames: [archive],
      subtitles: [],
      sandbox: ["allow-scripts", "allow-same-origin", "allow-presentation"],
    },
    classifyError: defaultClassify,
    create: (_options, deps) => ({
      id: deps.id,
      supports: (ref) => ref.kind === "movie",
      resolve: (ref, signal) => resolve(deps, endpoints, ref, signal),
      health: async () => ok(undefined),
    }),
  }
}
