import { afterEach, describe, expect, it } from "vitest"
import { Router } from "./router.svelte"

afterEach(() => history.replaceState(null, "", "#/"))

describe("Router", () => {
  it("follows hash changes and navigates", async () => {
    const router = new Router()
    const stop = router.start()
    router.go({ name: "sign-up" })
    window.dispatchEvent(new HashChangeEvent("hashchange"))
    expect(router.route).toEqual({ name: "sign-up" })
    router.go({ name: "privacy" }, true)
    expect(router.route).toEqual({ name: "privacy" })
    expect(location.hash).toBe("#/privacy")
    stop()
  })
})
