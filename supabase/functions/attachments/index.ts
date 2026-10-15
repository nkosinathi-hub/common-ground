// Attachments Edge Function: upload intent, finalize (magic-byte check), signed downloads and
// the scheduled cleanup of abandoned uploads.
// Thin entry: wiring only. Behaviour lives in ../_shared/attachments and is unit-tested by Vitest.
// Never log tokens, signed URLs, request bodies or file contents here.
import { parseOrigins } from "../_shared/catalog/http.ts"
import { createAttachmentsHandler } from "../_shared/attachments/handler.ts"
import { adminClient, createGate } from "./gate.ts"
import { createObjectStorage } from "./storage.ts"
import { createStore } from "./store.ts"

const env = (name: string): string => Deno.env.get(name) ?? ""

const supabaseUrl = env("SUPABASE_URL")
const admin = adminClient(supabaseUrl, env("SUPABASE_SERVICE_ROLE_KEY"))

const handler = createAttachmentsHandler({
  allowedOrigins: parseOrigins(env("ALLOWED_ORIGINS")),
  cleanupSecret: env("CLEANUP_SECRET"),
  gate: createGate(supabaseUrl, env("SUPABASE_ANON_KEY"), admin),
  store: createStore(admin),
  storage: createObjectStorage(admin),
})

Deno.serve(handler)
