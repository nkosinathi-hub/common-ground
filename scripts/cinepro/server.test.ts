import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"

const dirs: string[] = []
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "cinepro-install-"))
  dirs.push(dir)
  const log = join(dir, "calls")
  const script = join(dir, "scripts/cinepro/server.sh")
  mkdirSync(join(dir, "scripts/cinepro"), { recursive: true })
  mkdirSync(join(dir, "cinepro/runtime"), { recursive: true })
  copyFileSync("scripts/cinepro/server.sh", script)
  for (const file of [".env", "runtime/preload.mjs", "stream-patterns.js"])
    writeFileSync(join(dir, "cinepro", file), "fixture")
  const names = ["podman", "systemctl", "loginctl", "tailscale", "curl"]
  for (const name of names) {
    const status =
      name === "tailscale"
        ? 'if [ "$1" = status ]; then echo \'{"CertDomains":["fixture.ts.net"],"Self":{"DNSName":"fixture.ts.net."}}\'; fi'
        : ""
    writeFileSync(
      join(dir, name),
      `#!/bin/sh\necho '${name}' "$*" "$CINEPRO_RUNTIME_VERSION" >> "$CINEPRO_TEST_LOG"\n${status}\nexit 0\n`,
      { mode: 0o755 },
    )
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${dir}:${process.env.PATH}`,
    XDG_CONFIG_HOME: dir,
    CINEPRO_TEST_LOG: log,
  }
  delete env.USER // Noninteractive runners and services may omit it.
  const run = (action: string) =>
    execFileSync("bash", [script, action, "funnel"], { env, encoding: "utf8" })
  return { dir, log, run }
}

// No real daemon, container, route or user service is modified by these command stubs.
it("reinstalling writes one identical unit and restarts it to apply updates", () => {
  const { dir, log, run } = setup()
  run("install")
  const path = join(dir, "systemd/user/common-ground-cinepro.service")
  const first = readFileSync(path, "utf8")
  run("install")
  expect(readFileSync(path, "utf8")).toBe(first)
  expect(first).toContain("start funnel")
  const calls = readFileSync(log, "utf8")
  expect(calls.match(/systemctl --user restart common-ground-cinepro.service/g)).toHaveLength(2)
  expect(calls.match(/systemctl --user enable common-ground-cinepro.service/g)).toHaveLength(2)
})

it("repeated starts use a stable runtime digest and the same service and Funnel route", () => {
  const { log, run } = setup()
  run("start")
  run("start")
  const calls = readFileSync(log, "utf8")
  const digests = calls
    .split("\n")
    .filter((l) => l.startsWith("podman "))
    .map((l) => l.match(/[a-f0-9]{64}$/)?.[0])
  expect(digests).toHaveLength(2)
  expect(digests[0]).toMatch(/^[a-f0-9]{64}$/)
  expect(digests[1]).toBe(digests[0])
  expect(
    calls.match(/tailscale funnel --bg --yes --https=8443 http:\/\/127.0.0.1:3000/g),
  ).toHaveLength(2)
})
