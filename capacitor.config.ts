import type { CapacitorConfig } from "@capacitor/cli"

/** The Android app wraps the `app` build mode (base "/"), served from https://localhost. */
const config: CapacitorConfig = {
  appId: "io.github.nkosinathihub.commonground",
  appName: "Common Ground",
  webDir: "dist",
  android: { allowMixedContent: false },
  plugins: {
    Keyboard: { resize: "native" },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
}

export default config
