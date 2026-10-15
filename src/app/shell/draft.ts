/** Unsent quick-capture text survives a reload. Only the draft title is stored, per space. */
const key = (spaceId: string) => `common-ground:capture-draft:${spaceId}`

export const captureDraft = {
  read(spaceId: string): string {
    try {
      return localStorage.getItem(key(spaceId)) ?? ""
    } catch {
      return ""
    }
  },
  write(spaceId: string, text: string): void {
    try {
      if (text.trim()) localStorage.setItem(key(spaceId), text)
      else localStorage.removeItem(key(spaceId))
    } catch {
      /* storage unavailable */
    }
  },
}
