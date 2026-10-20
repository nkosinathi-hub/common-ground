import type { DeviceStore } from "@/shared/domain"
import type { ActiveSpaceStore } from "../application/ports"

const KEY = "active-space"

/** Only the space id is stored on the device. */
export class LocalActiveSpace implements ActiveSpaceStore {
  constructor(private readonly store: DeviceStore) {}

  read = (): string | null => this.store.read(KEY)
  write = (spaceId: string | null): void => this.store.write(KEY, spaceId)
}
