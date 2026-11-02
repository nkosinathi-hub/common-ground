import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { cleanUp, setup } from "./server-fixture"

afterEach(cleanUp)

// No real daemon, container, route or user service is modified by these command stubs.
it("reinstalling writes one identical unit and restarts it to apply updates", () => {
  const { dir, log, run } = setup()
  run("install")
  const path = join(dir, "systemd/user/common-ground-cinepro.service")
  const first = readFileSync(path, "utf8")
  run("install")
  expect(readFileSync(path, "utf8")).toBe(first)
  expect(first).toContain("start funnel")
  expect(first).toContain("Restart=on-failure")
  expect(first).toContain("StartLimitIntervalSec=0")
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
