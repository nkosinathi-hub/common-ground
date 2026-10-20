import { execSync } from "node:child_process"
import { dockerHost } from "../setup/system"

const e2e = process.argv.includes("--e2e")
// DOCKER_HOST from the environment wins; otherwise the same detector `pnpm run setup` uses.
const host = dockerHost()
const DOCKER = host ? { DOCKER_HOST: host } : {}

// Edge Functions type-check under the edge runtime's Deno, against the committed deno.lock.
const DENO = "docker.io/denoland/deno:2.1.4"
const DENO_CHECK =
  "deno check --frozen catalog/index.ts attachments/index.ts push/index.ts simkl/index.ts"

const steps: [string, string][] = [
  ["format", "pnpm -s format:check"],
  ["audit", "pnpm -s audit --audit-level high"],
  ["static", "tsx scripts/guard/static-checks.ts"],
  ["lint", "pnpm -s lint"],
  ["cycles", "pnpm -s cycles"],
  ["duplication", "pnpm -s duplication"],
  ["deadcode", "pnpm -s deadcode"],
  ["check", "pnpm -s check"],
  ["unit", "pnpm -s vitest run --coverage"],
  ["functions", `docker run --rm -v "$PWD/supabase/functions:/fn:z" -w /fn ${DENO} ${DENO_CHECK}`],
  ["supabase", "pnpm -s supabase status >/dev/null 2>&1 || pnpm -s supabase start"],
  ["db", "pnpm -s supabase migration up --local >/dev/null && pnpm -s supabase test db"],
  ["advisors", "pnpm -s supabase db advisors --local --fail-on warn"],
  ["build", "pnpm -s build"],
  ["bundle", "tsx scripts/guard/bundle-scan.ts"],
]
if (e2e) steps.push(["e2e", "pnpm -s test:e2e"])

for (const [name, command] of steps) {
  const started = Date.now()
  console.log(`\n== guard: ${name}`)
  try {
    execSync(command, { stdio: "inherit", env: { ...process.env, ...DOCKER } })
  } catch {
    console.error(`\nguard failed at step "${name}"`)
    process.exit(1)
  }
  console.log(`== ${name} ok (${Math.round((Date.now() - started) / 1000)}s)`)
}
console.log("\nguard: all checks passed")
