/** Small per-device values (a draft, the last view). Reads never fail; writes of null forget. */
export interface DeviceStore {
  read(key: string): string | null
  write(key: string, value: string | null): void
}
