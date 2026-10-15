import { execSync } from "node:child_process"
import { envOverrides, parseStatusEnv } from "../setup/supabase"

// Prints .env.local content for the running local stack (public values only).
const out = execSync("pnpm -s exec supabase status -o env", { encoding: "utf8" })
for (const [key, value] of Object.entries(envOverrides(parseStatusEnv(out)))) {
  console.log(`${key}=${value}`)
}
