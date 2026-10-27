import { now } from "./identity"
import { watchRows } from "./watch-data"

const titles = watchRows.map((row) => ({
  id: row.catalog_id,
  type: row.catalog_type,
  title: row.title,
  year: row.release_year,
  mediaKind: row.media_type,
  posterPath: row.poster_path,
  synopsis: row.synopsis,
}))
const episodes = ["Pilot", "Biscuits", "Trent Crimm: The Independent", "For the Children"]

/** The real catalog adapter reads the same wire shape as its Edge Function. */
export function demoCatalog(body: Record<string, unknown>) {
  const fresh = { checkedAt: now, stale: false }
  if (body.action === "search")
    return {
      ...fresh,
      page: 1,
      totalPages: 1,
      results: titles.filter((title) =>
        title.title
          .toLowerCase()
          .includes((typeof body.q === "string" ? body.q : "").toLowerCase()),
      ),
    }
  if (body.action === "season")
    return {
      ...fresh,
      number: body.season,
      episodes: episodes.map((name, i) => ({
        number: i + 1,
        name,
        airDate: "2020-08-14",
        runtimeMinutes: 30,
      })),
    }
  const title = titles.find((item) => item.id === body.id) ?? titles[0]!
  return {
    ...fresh,
    title,
    trailerKey: "demoTrailer",
    imdbId: null,
    recommendations: titles.filter((item) => item.id !== title.id),
    seasons:
      title.type === "tv"
        ? [1, 2, 3].map((number) => ({
            number,
            name: `Season ${number}`,
            episodeCount: 4,
            airDate: "2020-08-14",
          }))
        : [],
    nextEpisode: null,
    availability: {
      fallback: false,
      regions: [
        {
          code: "ZA",
          name: "South Africa",
          link: null,
          categories: [
            { key: "flatrate", label: "Stream", providers: ["Sample streaming service"] },
          ],
        },
      ],
    },
  }
}
