// Attachments Edge Function: upload intent, finalize (magic-byte check), signed downloads and
// the scheduled cleanup of abandoned uploads and orphaned space pictures. Deployed with verify_jwt = false (config.toml):
// the handler verifies the caller JWT for user actions and the cleanup secret for cleanup.
// Thin entry: wiring only. Behaviour lives in ../_shared/attachments and is unit-tested by Vitest.
// Never log tokens, signed URLs, request bodies or file contents here.
import { adminClient, createGate } from "../_deno/supabase-gate.ts"
import { createAttachmentsHandler } from "../_shared/attachments/handler.ts"
import { parseOrigins } from "../_shared/http/cors.ts"
import { createSpaceMedia } from "./space-media.ts"
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
  storage: createObjectStorage(admin, env("PUBLIC_API_URL")),
  media: createSpaceMedia(admin),
})

Deno.serve(handler)
