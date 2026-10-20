import type { CapacitorConfig } from "@capacitor/cli"

/** Smoke tests reach a local Supabase over http (scripts/android/smoke.sh); releases never. */
const local = process.env.CG_LOCAL_STACK === "1"

/** The Android app wraps the `app` build mode (base "/"), served from https://localhost. */
const config: CapacitorConfig = {
  appId: "io.github.nkosinathihub.commonground",
  appName: "Common Ground",
  webDir: "dist",
  // The bridge logs plugin calls, the stored auth session among them: never outside smoke tests.
  loggingBehavior: local ? "debug" : "none",
  android: { allowMixedContent: local },
  ...(local ? { server: { cleartext: true } } : {}),
  plugins: {
    Keyboard: { resize: "native" },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
}

export default config
