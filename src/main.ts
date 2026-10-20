import { Capacitor } from "@capacitor/core"
import { mount } from "svelte"
import App from "./app/App.svelte"
import { isFramed, refuseFrame } from "./app/framing"
import "./app.css"

const target = document.getElementById("app")!

/** The Android app first takes in the link that launched it; the website mounts at once. */
async function start(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const native = await import("./app/native")
    const site = import.meta.env.VITE_PUBLIC_APP_URL as string
    await native.prepareLaunch(site)
    native.startNative(site)
  }
  mount(App, { target })
}

if (isFramed(window)) refuseFrame(target, location.href)
else void start()
