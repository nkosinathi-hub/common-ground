import { execSync } from "node:child_process"
import { dockerHost } from "../setup/system"

const e2e = process.argv.includes("--e2e")
// DOCKER_HOST from the environment wins; otherwise the same detector `pnpm run setup` uses.
const host = dockerHost()
const DOCKER = host ? { DOCKER_HOST: host } : {}

const steps: [string, string][] = [
  ["format", "pnpm -s format:check"],
  ["static", "tsx scripts/guard/static-checks.ts"],
  ["lint", "pnpm -s lint"],
  ["check", "pnpm -s check"],
  ["unit", "pnpm -s vitest run --coverage"],
  ["supabase", "pnpm -s supabase status >/dev/null 2>&1 || pnpm -s supabase start"],
  ["db", "pnpm -s supabase migration up --local >/dev/null && pnpm -s supabase test db"],
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
