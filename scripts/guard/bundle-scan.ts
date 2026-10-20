import { existsSync, readFileSync } from "node:fs"
import { scanDir, secretValuesOf } from "./bundle-rules"

const ENV_FILE = "supabase/functions/.env"
const secrets = existsSync(ENV_FILE) ? secretValuesOf(readFileSync(ENV_FILE, "utf8")) : []
const hits = scanDir("dist", secrets)

for (const path of hits) console.error(`${path}: contains a server-side secret`)
if (hits.length > 0) process.exit(1)
console.log("bundle scan: no secrets in dist/")
