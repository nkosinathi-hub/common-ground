import { Preferences } from "@capacitor/preferences"

/**
 * Auth session storage for the Android app. WebView storage can be cleared under storage
 * pressure, which would sign the user out; Preferences is the app's own SharedPreferences.
 */
export const preferencesStorage = {
  getItem: async (key: string) => (await Preferences.get({ key })).value,
  setItem: (key: string, value: string) => Preferences.set({ key, value }),
  removeItem: (key: string) => Preferences.remove({ key }),
}
