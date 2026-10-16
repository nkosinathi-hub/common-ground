import { test } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { withRetry } from "./retry"
import { parseStatusEnv } from "../../../scripts/setup/supabase"
import { dockerHost } from "../../../scripts/setup/system"

let cached: Record<string, string> | null = null

function status(): Record<string, string> {
  // A saved `supabase status -o env` output, for machines where the CLI call is slow.
  const saved = process.env.E2E_STACK_ENV
  if (saved) return parseStatusEnv(readFileSync(saved, "utf8"))
  const host = dockerHost()
  const env = { ...process.env, ...(host ? { DOCKER_HOST: host } : {}) }
  const out = execSync("pnpm -s exec supabase status -o env", {
    encoding: "utf8",
    env,
    stdio: "pipe",
  })
  return parseStatusEnv(out)
}

/** Local stack values from `supabase status`. Local keys only; never production. */
export function stack(): Record<string, string> {
  cached ??= status()
  return cached
}

function stackRunning(): boolean {
  try {
    return Boolean(stack().API_URL)
  } catch {
    return false
  }
}

/** Call at the top of a spec file whose tests need the local Supabase stack. */
export function requireStack(): void {
  test.skip(!stackRunning(), "local Supabase stack is not running; start it with `pnpm run setup`")
}

export const admin = () =>
  createClient(stack().API_URL!, stack().SECRET_KEY ?? stack().SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

export interface TestUser {
  readonly email: string
  readonly password: string
  readonly name: string
}

export const uniqueEmail = (handle: string) =>
  `${handle}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@e2e.test`

/** Creates a verified account directly, for tests that are not about sign-up itself. */
export async function createUser(handle: string): Promise<TestUser> {
  const user = { email: uniqueEmail(handle), password: "correct horse battery", name: handle }
  let attempts = 0
  await withRetry(async () => {
    attempts++
    const { error } = await admin().auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { display_name: handle },
    })
    // A timed-out attempt can still have created the user; the retry then finds it exists.
    if (error && !(attempts > 1 && error.code === "email_exists")) throw error
  })
  return user
}
