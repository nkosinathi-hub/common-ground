import { deviceStore } from "@/shared/ui"

/** Unsent quick-capture text survives a reload. Only the draft title is stored, per space. */
const key = (spaceId: string) => `capture-draft:${spaceId}`

export const captureDraft = {
  read: (spaceId: string): string => deviceStore().read(key(spaceId)) ?? "",
  write: (spaceId: string, text: string): void =>
    deviceStore().write(key(spaceId), text.trim() ? text : null),
}
