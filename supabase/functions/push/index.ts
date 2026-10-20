// Push Edge Function: sends one new notification to its recipient's phones through FCM HTTP v1.
// Called only by the notifications_push trigger through pg_net with the push secret; deployed
// with verify_jwt = false (config.toml). Thin entry: wiring only. Behaviour lives in
// ../_shared/push and is unit-tested by Vitest. Never log tokens, keys or message text here.
import { adminClient } from "../_deno/supabase-gate.ts"
import { createTokenSource } from "../_shared/push/access-token.ts"
import { createFcmSender } from "../_shared/push/fcm.ts"
import { createPushHandler } from "../_shared/push/handler.ts"
import { parseServiceAccount } from "../_shared/push/service-account.ts"
import { createPushStore } from "./store.ts"

const env = (name: string): string => Deno.env.get(name) ?? ""

const account = parseServiceAccount(env("FCM_SERVICE_ACCOUNT"))
const fetchFn = (url: string, init: RequestInit) => fetch(url, init)
const send = account
  ? createFcmSender(account.projectId, createTokenSource(account, fetchFn), fetchFn)
  : null

const handler = createPushHandler({
  pushSecret: env("PUSH_SECRET"),
  store: createPushStore(adminClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))),
  send,
})

Deno.serve(handler)
