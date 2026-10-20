import { deviceStore } from "@/shared/ui"

/** A per-device yes/no. Without storage the default shows again next time. */
export function remembered(key: string) {
  return {
    get: (): boolean => deviceStore().read(key) === "1",
    set: (on: boolean): void => deviceStore().write(key, on ? "1" : null),
  }
}
