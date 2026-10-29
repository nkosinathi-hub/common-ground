// Catalog Edge Function: TMDB search, details and watch providers for space members.
// Thin entry: wiring only. Behaviour lives in ../_shared/catalog and is unit-tested by Vitest.
// Never log tokens, request bodies or TMDB responses here.
import { adminClient, createGate } from "../_deno/supabase-gate.ts"
import { createCatalogHandler } from "../_shared/catalog/handler.ts"
import { createCatalogService } from "../_shared/catalog/service.ts"
import { createTmdbClient } from "../_shared/catalog/tmdb-client.ts"
import { parseOrigins } from "../_shared/http/cors.ts"
import { createCacheStore } from "./cache-store.ts"

const env = (name: string): string => Deno.env.get(name) ?? ""

const supabaseUrl = env("SUPABASE_URL")
const admin = adminClient(supabaseUrl, env("SUPABASE_SERVICE_ROLE_KEY"))

const handler = createCatalogHandler({
  allowedOrigins: parseOrigins(env("ALLOWED_ORIGINS")),
  gate: createGate(supabaseUrl, env("SUPABASE_ANON_KEY"), admin),
  // Only the service role may write For you features; members cannot set them.
  features: async (f) => {
    await admin.rpc("set_watch_features", {
      target_space: f.spaceId,
      kind: f.type,
      tmdb_id: f.id,
      new_genres: [...f.genres],
      new_streamable: f.streamable,
    })
  },
  service: createCatalogService({
    cache: createCacheStore(admin),
    tmdb: createTmdbClient({
      token: env("TMDB_ACCESS_TOKEN"),
      baseUrl: env("TMDB_BASE_URL"),
      fetch: (url, init) => fetch(url, init),
    }),
  }),
})

Deno.serve(handler)
