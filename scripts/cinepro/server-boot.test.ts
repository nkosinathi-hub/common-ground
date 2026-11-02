import { readFileSync } from "node:fs"
import { afterEach, expect, it } from "vitest"
import { cleanUp, setup } from "./server-fixture"

afterEach(cleanUp)

const FUNNEL = /tailscale funnel --bg --yes --https=8443 http:\/\/127.0.0.1:3000/

// At boot the user service can run before tailscaled is up or before the tailnet is online.
it("start waits for Tailscale to come online at boot instead of giving up", () => {
  const { log, run } = setup({ downCalls: 2, offlineCalls: 3 })
  run("start")
  expect(readFileSync(log, "utf8")).toMatch(FUNNEL)
})

it("start still asks for HTTPS certificates when they never appear", () => {
  const { log, run } = setup({ neverReady: true })
  let failure = ""
  try {
    run("start", { CINEPRO_TAILNET_WAIT: "3" })
  } catch (error) {
    failure = String((error as { stderr?: string }).stderr)
  }
  expect(failure).toContain("enable HTTPS Certificates")
  expect(readFileSync(log, "utf8")).not.toMatch(FUNNEL)
})
