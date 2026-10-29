// One-off: gives titles saved before v0.6 their For you features (canonical genres, streams here).
// Idempotent: set_watch_features changes nothing when the features already match, so it can run
// again safely. Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and TMDB_ACCESS_TOKEN in the
// environment; it never prints them. Usage: npx tsx scripts/catalog/backfill-features.ts
import { createClient } from "@supabase/supabase-js"
import { detailsPath, mapDetails } from "../../supabase/functions/_shared/catalog/details.ts"
import { featuresOf } from "../../supabase/functions/_shared/catalog/features.ts"

const need = (name: string) => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const db = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"))
const token = need("TMDB_ACCESS_TOKEN")

async function tmdb(path: string): Promise<unknown> {
  const response = await fetch(`https://api.themoviedb.org/3/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (!response.ok) throw new Error(`TMDB answered ${response.status} for ${path.split("?")[0]}`)
  return response.json()
}

const { data: rows, error } = await db
  .from("watch_items")
  .select("space_id, catalog_type, catalog_id")
  .not("catalog_id", "is", null)
  .eq("genres", "{}")
if (error) throw new Error(error.message)

let done = 0
for (const row of rows ?? []) {
  const type = row.catalog_type as "movie" | "tv"
  const details = mapDetails(await tmdb(detailsPath(type, row.catalog_id as number)), type)
  const f = featuresOf(row.space_id as string, type, row.catalog_id as number, details)
  const { error: failed } = await db.rpc("set_watch_features", {
    target_space: f.spaceId,
    kind: f.type,
    tmdb_id: f.id,
    new_genres: [...f.genres],
    new_streamable: f.streamable,
  })
  if (failed) throw new Error(failed.message)
  done += 1
  await new Promise((resolve) => setTimeout(resolve, 250)) // well under TMDB's rate limit
}
console.log(`Features set for ${done} title(s).`)
