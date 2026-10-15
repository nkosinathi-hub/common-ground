import { createClient } from "@supabase/supabase-js"
import { execSync } from "node:child_process"

let cached: Record<string, string> | null = null

/** Local stack values from `supabase status`. Local keys only; never production. */
export function stack(): Record<string, string> {
  if (cached) return cached
  const out = execSync("pnpm -s exec supabase status -o env", { encoding: "utf8" })
  cached = Object.fromEntries(
    out.split("\n").flatMap((line) => {
      const m = /^([A-Z_]+)="?([^"]*)"?$/.exec(line.trim())
      return m ? [[m[1]!, m[2]!]] : []
    }),
  )
  return cached
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
  const { error } = await admin().auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { display_name: handle },
  })
  if (error) throw error
  return user
}
