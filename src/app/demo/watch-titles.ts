import { ANA, BEN } from "./identity"

export type Place = readonly [user: string, season: number | null, episode: number | null]
export interface Title {
  readonly title: string
  readonly catalog_id: number
  readonly release_year: number
  readonly media_type: "series" | "movie"
  readonly poster_path: string
  readonly synopsis: string
  readonly space?: string
  /** Each person's place; empty means nobody has started. */
  readonly places?: readonly Place[]
  readonly together?: { season: number; episode: number }
}

const both = (season: number, episode: number): Place[] => [
  [ANA, season, episode],
  [BEN, season, episode],
]

/** Ana and Ben's titles: several in progress, so Continue watching shows a row that scrolls. */
export const COUPLE_TITLES: Title[] = [
  {
    title: "Ted Lasso",
    catalog_id: 97546,
    release_year: 2020,
    media_type: "series",
    poster_path: "/5fhZdwP1DVJ0FyVH6vrFdHwpXIn.jpg",
    synopsis: "An American coach finds a new home with an English football team.",
    places: both(1, 2),
    together: { season: 1, episode: 2 },
  },
  {
    title: "The Bear",
    catalog_id: 136315,
    release_year: 2022,
    media_type: "series",
    poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",
    synopsis: "A young chef returns to Chicago to run his family's sandwich shop.",
    places: [
      [ANA, 2, 4],
      [BEN, 2, 1],
    ],
    together: { season: 2, episode: 1 },
  },
  {
    title: "Severance",
    catalog_id: 95396,
    release_year: 2022,
    media_type: "series",
    poster_path: "/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
    synopsis: "Office workers have their memories surgically divided between work and home.",
    places: [
      [ANA, 1, 3],
      [BEN, 1, 5],
    ],
  },
  {
    title: "Shōgun",
    catalog_id: 126308,
    release_year: 2024,
    media_type: "series",
    poster_path: "/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg",
    synopsis: "A shipwrecked English navigator is drawn into the politics of feudal Japan.",
    places: [[ANA, 1, 1]],
  },
  {
    title: "Arrival",
    catalog_id: 329865,
    release_year: 2016,
    media_type: "movie",
    poster_path: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    synopsis: "A linguist searches for meaning when mysterious visitors arrive on Earth.",
  },
]
