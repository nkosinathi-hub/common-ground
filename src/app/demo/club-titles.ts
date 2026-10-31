import { ANA, CLUB, CLUB_PEOPLE } from "./identity"
import type { Title } from "./watch-titles"

const [CY, DEE, EVE, FIN] = CLUB_PEOPLE.map(([id]) => id)

/** The book club's titles: five people at different episodes of the same show. */
export const CLUB_TITLES: Title[] = [
  {
    title: "Andor",
    catalog_id: 83867,
    release_year: 2022,
    media_type: "series",
    poster_path: "/khZqmwHQicTYoS7Flreb9EddFZC.jpg",
    synopsis: "A thief becomes a rebel in the years before the Rebellion.",
    space: CLUB,
    places: [
      [ANA, 1, 4],
      [CY!, 1, 7],
      [DEE!, 1, 2],
      [EVE!, 2, 1],
      [FIN!, 1, 9],
    ],
    together: { season: 1, episode: 2 },
  },
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
