import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { mergeEnv } from "./env-merge"
import { envOverrides, parseArgs, parseStatusEnv, startArgs } from "./supabase"
import { capture, dockerHost, run } from "./system"
import { checkVersions, parseMise } from "./versions"

// pnpm setup: one entry point on Linux, macOS and Windows. Safe to run again at any time.
const options = parseArgs(process.argv.slice(2))
const log = (message: string) => console.log(`== setup: ${message}`)

function tools(): void {
  const pnpm = capture("pnpm", ["--version"], process.env)?.trim() ?? "missing"
  const problems = checkVersions(
    { node: process.version, pnpm },
    parseMise(readFileSync(".mise.toml", "utf8")),
  )
  for (const problem of problems) console.error(problem)
  if (problems.length > 0) process.exit(1)
  log(`node ${process.version}, pnpm ${pnpm}`)
}

function engineEnv(): NodeJS.ProcessEnv {
  const host = dockerHost()
  if (!host) {
    console.error("No container engine found. Start Podman or Docker, or set DOCKER_HOST.")
    console.error("Linux: systemctl --user enable --now podman.socket")
    console.error("macOS/Windows: podman machine start, or start Docker Desktop")
    process.exit(1)
  }
  log(`container engine ${host}`)
  return { ...process.env, DOCKER_HOST: host }
}

function stack(env: NodeJS.ProcessEnv): Record<string, string> {
  const supabase = (step: string, args: string[]) =>
    run(step, "pnpm", ["exec", "supabase", ...args], env)
  const status = () => capture("pnpm", ["exec", "supabase", "status", "-o", "env"], env)
  if (status() === null) supabase("start", startArgs(options))
  else log("supabase already running")
  supabase("migrations", ["migration", "up", "--local"])
  supabase("seed", ["db", "query", "--local", "-f", "supabase/seed.sql"])
  return parseStatusEnv(status() ?? "")
}

function dotenv(overrides: Record<string, string>): void {
  const current = existsSync(".env") ? readFileSync(".env", "utf8") : null
  const { text, added } = mergeEnv(readFileSync(".env.example", "utf8"), current, overrides)
  if (added.length > 0) writeFileSync(".env", text)
  log(added.length > 0 ? `.env gained ${added.join(", ")}` : ".env already complete")
}

try {
  tools()
  const overrides = options.skipStack ? {} : envOverrides(stack(engineEnv()))
  dotenv(overrides)
  log("done. Next: pnpm dev")
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
