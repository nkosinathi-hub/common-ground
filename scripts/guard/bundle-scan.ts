import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const FORBIDDEN = [/sb_secret_[A-Za-z0-9_-]+/, /"role"\s*:\s*"service_role"/, /service_role/]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function secretValues(): string[] {
  const envFile = "supabase/functions/.env"
  if (!existsSync(envFile)) return []
  return readFileSync(envFile, "utf8")
    .split("\n")
    .map((line) => line.split("=").slice(1).join("=").trim())
    .filter((value) => value.length >= 16)
}

const values = secretValues()
const hits = walk("dist").filter((path) => {
  const text = readFileSync(path, "utf8")
  return FORBIDDEN.some((rule) => rule.test(text)) || values.some((v) => text.includes(v))
})

for (const path of hits) console.error(`${path}: contains a server-side secret`)
if (hits.length > 0) process.exit(1)
console.log("bundle scan: no secrets in dist/")
