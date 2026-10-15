import { execSync } from "node:child_process"

const e2e = process.argv.includes("--e2e")
const DOCKER = { DOCKER_HOST: process.env.DOCKER_HOST ?? "unix:///run/user/1000/podman/podman.sock" }

const steps: [string, string][] = [
  ["format", "pnpm -s format:check"],
  ["static", "tsx scripts/guard/static-checks.ts"],
  ["lint", "pnpm -s lint"],
  ["check", "pnpm -s check"],
  ["unit", "pnpm -s vitest run --coverage"],
  ["supabase", "pnpm -s supabase status >/dev/null 2>&1 || pnpm -s supabase start"],
  ["db", "pnpm -s supabase db reset --local >/dev/null && pnpm -s supabase test db"],
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
