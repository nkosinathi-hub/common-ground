import type { SettingsTab } from "@/shared/domain"
import type { SpaceRole } from "./space"

/** Space settings in four tabs (D15a to D17). Members see their device's look and the members. */
export const SETTINGS_TAB_LABELS: Readonly<Record<SettingsTab, string>> = {
  identity: "Identity",
  look: "Look and feel",
  home: "Home & preferences",
  members: "Members & safety",
}

export const settingsTabsFor = (role: SpaceRole): SettingsTab[] =>
  role === "owner" ? ["identity", "look", "home", "members"] : ["home", "members"]

/** The tab to show: the one asked for when the viewer may see it, else their first. */
export function settingsTabOf(role: SpaceRole, requested: SettingsTab | undefined): SettingsTab {
  const tabs = settingsTabsFor(role)
  return requested && tabs.includes(requested) ? requested : tabs[0]!
}
