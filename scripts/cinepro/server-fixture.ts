import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const READY =
  '{"BackendState":"Running","CertDomains":["fixture.ts.net"],"Self":{"DNSName":"fixture.ts.net."}}'
const OFFLINE =
  '{"BackendState":"Starting","CertDomains":null,"Self":{"DNSName":"fixture.ts.net."}}'

export interface TailnetBoot {
  /** `tailscale status` fails outright this many times (daemon socket not up yet). */
  readonly downCalls?: number
  /** Then it answers without certificate domains this many times (tailnet not online yet). */
  readonly offlineCalls?: number
  /** Answer without certificate domains for ever. */
  readonly neverReady?: boolean
}

const dirs: string[] = []
export const cleanUp = () =>
  dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }))

function tailscaleStub(boot: TailnetBoot): string {
  const down = boot.downCalls ?? 0
  const offline = boot.neverReady ? 1_000_000 : (boot.offlineCalls ?? 0)
  return [
    'if [ "$1" = status ]; then',
    '  n=$(cat "$CINEPRO_TEST_LOG.status" 2>/dev/null || echo 0); n=$((n + 1)); echo $n > "$CINEPRO_TEST_LOG.status"',
    `  [ $n -le ${down} ] && exit 1`,
    `  if [ $n -le $((${down} + ${offline})) ]; then echo '${OFFLINE}'; else echo '${READY}'; fi`,
    "fi",
  ].join("\n")
}

/** A copy of server.sh whose podman, systemctl, loginctl, tailscale and curl are logging stubs. */
export function setup(boot: TailnetBoot = {}) {
  const dir = mkdtempSync(join(tmpdir(), "cinepro-install-"))
  dirs.push(dir)
  const log = join(dir, "calls")
  const script = join(dir, "scripts/cinepro/server.sh")
  mkdirSync(join(dir, "scripts/cinepro"), { recursive: true })
  mkdirSync(join(dir, "cinepro/runtime"), { recursive: true })
  copyFileSync("scripts/cinepro/server.sh", script)
  copyFileSync("scripts/cinepro/tailnet.sh", join(dir, "scripts/cinepro/tailnet.sh"))
  for (const file of [".env", "runtime/preload.mjs", "stream-patterns.js"])
    writeFileSync(join(dir, "cinepro", file), "fixture")
  for (const name of ["podman", "systemctl", "loginctl", "tailscale", "curl"]) {
    const body = name === "tailscale" ? tailscaleStub(boot) : ""
    writeFileSync(
      join(dir, name),
      `#!/bin/sh\necho '${name}' "$*" "$CINEPRO_RUNTIME_VERSION" >> "$CINEPRO_TEST_LOG"\n${body}\nexit 0\n`,
      { mode: 0o755 },
    )
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${dir}:${process.env.PATH}`,
    XDG_CONFIG_HOME: dir,
    CINEPRO_TEST_LOG: log,
    CINEPRO_TAILNET_POLL: "0",
  }
  delete env.USER // Noninteractive runners and services may omit it.
  const run = (action: string, extra: NodeJS.ProcessEnv = {}) =>
    execFileSync("bash", [script, action, "funnel"], {
      env: { ...env, ...extra },
      encoding: "utf8",
      stdio: "pipe",
    })
  return { dir, log, run }
}
