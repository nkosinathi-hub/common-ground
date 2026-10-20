import { Browser } from "@capacitor/browser"
import { Capacitor } from "@capacitor/core"

/** Opens a short-lived signed URL: a browser tab on Android, a plain link on the web. */
export function openUrl(url: string): void {
  if (Capacitor.isNativePlatform()) return void Browser.open({ url })
  const link = document.createElement("a")
  link.href = url
  link.rel = "noopener"
  link.click()
}
