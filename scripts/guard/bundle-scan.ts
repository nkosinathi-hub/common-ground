import { existsSync, readFileSync } from "node:fs"
import { scanDir } from "./bundle-rules"

function secretValues(): string[] {
  const envFile = "supabase/functions/.env"
  if (!existsSync(envFile)) return []
  return readFileSync(envFile, "utf8")
    .split("\n")
    .map((line) => line.split("=").slice(1).join("=").trim())
    .filter((value) => value.length >= 16)
}

const hits = scanDir("dist", secretValues())

for (const path of hits) console.error(`${path}: contains a server-side secret`)
if (hits.length > 0) process.exit(1)
console.log("bundle scan: no secrets in dist/")
