import type { Result } from "@/shared/domain"

/** Signed URLs last an hour; sign again well before that. */
export const SIGNED_SECONDS = 3600
const FRESH_MS = 50 * 60_000

interface Signed {
  readonly url: string
  readonly at: number
}

type Sign = (paths: readonly string[]) => Promise<Result<Record<string, string>>>

/** Caches signed space-media URLs and signs whatever is missing or stale in one batch. */
export class MediaUrls {
  private readonly cache = new Map<string, Signed>()

  constructor(
    private readonly sign: Sign,
    private readonly now: () => number,
  ) {}

  async resolve(paths: readonly (string | null)[]): Promise<Record<string, string>> {
    const wanted = [...new Set(paths.filter((p): p is string => Boolean(p)))]
    const stale = wanted.filter((path) => !this.fresh(path))
    if (stale.length > 0) {
      const signed = await this.sign(stale)
      const at = this.now()
      if (signed.ok)
        for (const [path, url] of Object.entries(signed.value)) this.cache.set(path, { url, at })
    }
    return Object.fromEntries(
      wanted.flatMap((path) => {
        const hit = this.cache.get(path)
        return hit ? [[path, hit.url]] : []
      }),
    )
  }

  private fresh(path: string) {
    const hit = this.cache.get(path)
    return hit !== undefined && this.now() - hit.at < FRESH_MS
  }
}
