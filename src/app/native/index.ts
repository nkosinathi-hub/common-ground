import { App } from "@capacitor/app"
import { deviceStore } from "@/shared/ui"
import { checkForUpdate } from "./check-update"
import { firstTime } from "./launch"
import { backAction, inAppPath } from "./links"

const opened = deviceStore("session")

/** The in-app path for a link not opened yet this app session, or null. */
function pathFor(link: string | undefined, siteUrl: string): string | null {
  if (!link || !firstTime(opened, link)) return null
  return inAppPath(link, siteUrl)
}

/** Cold start from an App Link: put its query and hash in place before boot reads them. */
export async function prepareLaunch(siteUrl: string): Promise<void> {
  const path = pathFor((await App.getLaunchUrl())?.url, siteUrl)
  if (path) history.replaceState(null, "", path)
}

/** Android back button, App Links that arrive while the app is open, and update checks. */
export function startNative(siteUrl: string): void {
  void checkForUpdate(siteUrl)
  void App.addListener("resume", () => void checkForUpdate(siteUrl))
  void App.addListener("appUrlOpen", ({ url }) => {
    const path = pathFor(url, siteUrl)
    if (path) location.replace(path)
  })
  void App.addListener("backButton", ({ canGoBack }) => {
    if (backAction(location.hash, canGoBack) === "back") history.back()
    else void App.minimizeApp()
  })
}
