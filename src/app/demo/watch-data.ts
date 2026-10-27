import { ANA, BEN, SPACE, demoId, now } from "./identity"

export const watchRows = [
  {
    title: "Ted Lasso",
    catalog_id: 97546,
    release_year: 2020,
    media_type: "series",
    poster_path: "/5fhZdwP1DVJ0FyVH6vrFdHwpXIn.jpg",
    synopsis: "An American coach finds a new home with an English football team.",
  },
  {
    title: "Arrival",
    catalog_id: 329865,
    release_year: 2016,
    media_type: "movie",
    poster_path: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    synopsis: "A linguist searches for meaning when mysterious visitors arrive on Earth.",
  },
  {
    title: "The Bear",
    catalog_id: 136315,
    release_year: 2022,
    media_type: "series",
    poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",
    synopsis: "A young chef returns to Chicago to run his family's sandwich shop.",
  },
].map((title, i) => ({
  ...title,
  id: demoId(10 + i),
  space_id: SPACE,
  catalog_type: title.media_type === "movie" ? "movie" : "tv",
  shared_intent: "watch_together",
  manual_availability_note: "Saved for our next evening together",
  created_by: ANA,
  created_at: now,
  my_progress: i === 0 ? "watching" : "not_started",
  sort_key: now,
  together: i === 0 ? { season: 1, episode: 2 } : null,
  places: [ANA, BEN].map((user_id) => ({
    user_id,
    status: i === 0 ? "watching" : "not_started",
    season: i === 0 ? 1 : null,
    episode: i === 0 ? 2 : null,
  })),
}))

export const progressRows = watchRows.flatMap((item, i) =>
  [ANA, BEN].map((user_id) => ({
    user_id,
    watch_item_id: item.id,
    space_id: SPACE,
    status: item.my_progress,
    season: i === 0 ? 1 : null,
    episode: i === 0 ? 2 : null,
    rating: null,
    completed_on: null,
    updated_at: now,
  })),
)
