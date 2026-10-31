/**
 * A streaming service's own search for a title. TMDB lists who has a title but links only to its
 * own page; JustWatch's per-service links need a partner deal. Searching the service lands one tap
 * from the title. Unknown services return null, and the row keeps the TMDB page.
 */
const SEARCHES: readonly [RegExp, (q: string) => string][] = [
  [/^Netflix/i, (q) => `https://www.netflix.com/search?q=${q}`],
  [
    /^Amazon Prime Video|^Amazon Video|^Prime Video/i,
    (q) => `https://www.primevideo.com/search/ref=atv_nb_sug?phrase=${q}`,
  ],
  [/^Disney ?(Plus|\+)/i, (q) => `https://www.disneyplus.com/search?q=${q}`],
  [/^Apple TV/i, (q) => `https://tv.apple.com/search?term=${q}`],
  [/^YouTube/i, (q) => `https://www.youtube.com/results?search_query=${q}`],
  [/^Google Play/i, (q) => `https://play.google.com/store/search?q=${q}&c=movies`],
  [/^(HBO )?Max\b/i, (q) => `https://play.max.com/search?q=${q}`],
  [/^Paramount ?(Plus|\+)/i, (q) => `https://www.paramountplus.com/search/?q=${q}`],
  [/^MUBI/i, (q) => `https://mubi.com/en/search/films?query=${q}`],
  [/^Crunchyroll/i, (q) => `https://www.crunchyroll.com/search?q=${q}`],
  [/^BritBox/i, (q) => `https://www.britbox.com/search?q=${q}`],
  [/^Microsoft Store/i, (q) => `https://www.microsoft.com/en-us/search/shop/movies?q=${q}`],
  [/^Plex/i, (q) => `https://watch.plex.tv/search?q=${q}`],
  [/^Tubi/i, (q) => `https://tubitv.com/search/${q}`],
]

export function providerLink(provider: string, title: string): string | null {
  const search = SEARCHES.find(([name]) => name.test(provider.trim()))
  return search ? search[1](encodeURIComponent(title.trim())) : null
}
