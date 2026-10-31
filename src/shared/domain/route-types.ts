export const IDEA_TABS = ["overview", "research", "tasks", "milestones", "discussion"] as const
export type IdeaTab = (typeof IDEA_TABS)[number]
/** Space settings tabs (D15a to D17); a bare /settings opens the first one the viewer may see. */
export const SETTINGS_TABS = ["identity", "look", "home", "members"] as const
export type SettingsTab = (typeof SETTINGS_TABS)[number]
export const ACCOUNT_TABS = ["profile", "data"] as const
export type AccountTab = (typeof ACCOUNT_TABS)[number]
export const PRIVACY_PARTS = ["store", "rights"] as const
export type PrivacyPart = (typeof PRIVACY_PARTS)[number]
/** A title's tabs (M03 to M03d); wide screens show overview and episodes beside progress. */
export const TITLE_TABS = ["overview", "episodes", "progress", "discussion"] as const
export type TitleTab = (typeof TITLE_TABS)[number]

export type Route =
  | { name: "entry" | "not-found" | "demo" | "sign-in" | "sign-up" | "reset" | "new-password" }
  | { name: "new-space" }
  | { name: "account"; tab?: AccountTab }
  | { name: "privacy"; part?: PrivacyPart }
  | { name: "invite"; token: string }
  | { name: "home" | "watch" | "ideas" | "calendar" | "notes"; spaceId: string }
  | { name: "settings"; spaceId: string; tab?: SettingsTab }
  | { name: "note"; spaceId: string; noteId: string }
  | { name: "watch-item"; spaceId: string; itemId: string; tab?: TitleTab }
  | { name: "idea"; spaceId: string; ideaId: string; tab: IdeaTab }
  | { name: "event"; spaceId: string; eventId: string }
  | { name: "party"; spaceId: string; partyId: string }
