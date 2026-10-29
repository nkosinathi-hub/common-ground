import { ANA, CLUB, CLUB_PEOPLE } from "./identity"
import type { Title } from "./watch-titles"

const [CY, DEE, EVE, FIN] = CLUB_PEOPLE.map(([id]) => id)

/** The book club's titles: five people at different episodes of the same show. */
export const CLUB_TITLES: Title[] = [
  {
    title: "Chernobyl",
    catalog_id: 87108,
    release_year: 2019,
    media_type: "series",
    poster_path: "/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg",
    synopsis: "The story of the 1986 nuclear disaster and those who cleaned it up.",
    space: CLUB,
    places: [
      [ANA, 1, 3],
      [CY!, 1, 4],
      [DEE!, 1, 3],
      [EVE!, 1, 2],
      [FIN!, 1, 5],
    ],
    together: { season: 1, episode: 3 },
  },
  {
    title: "The Last of Us",
    catalog_id: 100088,
    release_year: 2023,
    media_type: "series",
    poster_path: "/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg",
    synopsis: "A smuggler escorts a teenager across a ruined America.",
    space: CLUB,
    places: [
      [ANA, 1, 6],
      [CY!, 1, 6],
      [DEE!, 1, 6],
      [EVE!, 1, 7],
      [FIN!, 1, 6],
    ],
  },
]
