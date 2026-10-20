// Simkl Edge Function: links a user's Simkl account by PIN and imports their watch history.
// Thin entry: wiring only. Behaviour lives in ../_shared/simkl and is unit-tested by Vitest.
// Never log tokens, request bodies or Simkl responses here. See docs/runbooks/simkl.md.
import { adminClient, createGate } from "../_deno/supabase-gate.ts"
import { parseOrigins } from "../_shared/http/cors.ts"
import { createSimklHandler } from "../_shared/simkl/handler.ts"
import { createSimklService } from "../_shared/simkl/service.ts"
import { createSimklClient } from "../_shared/simkl/simkl-client.ts"
import { createSimklStore } from "./store.ts"

const env = (name: string): string => Deno.env.get(name) ?? ""

const supabaseUrl = env("SUPABASE_URL")
const admin = adminClient(supabaseUrl, env("SUPABASE_SERVICE_ROLE_KEY"))
const clientId = env("SIMKL_CLIENT_ID")

const handler = createSimklHandler({
  allowedOrigins: parseOrigins(env("ALLOWED_ORIGINS")),
  gate: createGate(supabaseUrl, env("SUPABASE_ANON_KEY"), admin),
  clientId,
  service: createSimklService({
    client: createSimklClient({
      clientId,
      baseUrl: env("SIMKL_BASE_URL"),
      fetch: (url, init) => fetch(url, init),
    }),
    store: createSimklStore(admin),
    clock: () => new Date(),
  }),
})

Deno.serve(handler)
