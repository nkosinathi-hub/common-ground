/** The first letter of a display name, for avatars; "?" when the name is blank. */
export const initialOf = (name: string): string => name.trim().charAt(0).toUpperCase() || "?"
