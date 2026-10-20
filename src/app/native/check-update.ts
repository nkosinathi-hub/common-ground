import { App } from "@capacitor/app"
import { Browser } from "@capacitor/browser"
import { toast } from "svelte-sonner"
import { isNewer, parseRelease } from "./update"

/** Offers a newer APK from the website. Quietly does nothing offline or on a bad file. */
export async function checkForUpdate(siteUrl: string): Promise<void> {
  const folder = new URL("app/", siteUrl).href
  try {
    const response = await fetch(`${folder}version.json`, { cache: "no-store" })
    if (!response.ok) return
    const release = parseRelease(await response.json(), folder)
    const { version } = await App.getInfo()
    if (!release || !isNewer(release.version, version)) return
    toast.info(`Common Ground ${release.version} is ready`, {
      id: "app-update",
      duration: Number.POSITIVE_INFINITY,
      description: "Download it, then open the file to install.",
      action: { label: "Download", onClick: () => void Browser.open({ url: release.apk }) },
    })
  } catch {
    // Offline or the site is down: the next start or resume checks again.
  }
}
