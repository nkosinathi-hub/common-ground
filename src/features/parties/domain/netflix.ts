/** Where members play a Netflix party (#66), each on their own account. */
export const NETFLIX_ORIGIN = "https://www.netflix.com"

/** Opens the title's search on netflix.com: no affiliate code, no tracking parameters. */
export const netflixSearchUrl = (title: string): string =>
  `${NETFLIX_ORIGIN}/search?q=${encodeURIComponent(title.trim())}`
