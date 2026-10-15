import { execSync } from "node:child_process"

// Prints .env.local content for the running local stack (public values only).
const out = execSync("pnpm -s exec supabase status -o env", { encoding: "utf8" })
const read = (key: string) => new RegExp(`^${key}="?([^"\\n]+)"?`, "m").exec(out)?.[1] ?? ""
console.log(`VITE_SUPABASE_URL=${read("API_URL")}`)
console.log(`VITE_SUPABASE_ANON_KEY=${read("PUBLISHABLE_KEY")}`)
