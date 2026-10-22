import { describe, expect, it } from "vitest"
import { manifestFor } from "./manifest"

const firefox = manifestFor("https://abc.supabase.co", "0.5.2", "firefox")
type Gecko = { id: string; data_collection_permissions: { required: string[] } }
const gecko = (firefox as { browser_specific_settings?: { gecko: Gecko } })
  .browser_specific_settings?.gecko

describe("the Firefox manifest", () => {
  it("carries a fixed add-on id and needs Firefox 140 (data collection declarations)", () => {
    expect(gecko).toMatchObject({
      id: "watch-party@common-ground.nkosinathi-hub.github.io",
      strict_min_version: "140.0",
    })
    expect(firefox).not.toHaveProperty("minimum_chrome_version")
  })

  it("states Firefox for Android 142, the first there with data collection declarations", () => {
    const settings = (firefox as { browser_specific_settings?: object }).browser_specific_settings
    expect(settings).toMatchObject({ gecko_android: { strict_min_version: "142.0" } })
  })

  it("declares what it sends to its own server, as Mozilla asks", () => {
    expect(gecko?.data_collection_permissions.required).toEqual([
      "authenticationInfo",
      "websiteActivity",
    ])
  })

  it("keeps the same permissions, hosts and scripts as the Chromium build", () => {
    const chromium = manifestFor("https://abc.supabase.co", "0.5.2")
    expect(firefox.permissions).toEqual(chromium.permissions)
    expect(firefox.host_permissions).toEqual(chromium.host_permissions)
    expect(firefox.content_scripts).toEqual(chromium.content_scripts)
    expect(chromium).not.toHaveProperty("browser_specific_settings")
  })
})
