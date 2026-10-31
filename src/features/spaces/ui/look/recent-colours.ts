import { deviceStore } from "@/shared/ui"
import { normaliseHex } from "../../domain/color"

const KEY = "recent-colours"
const KEEP = 6

/** The last colours this device picked, newest first: a convenience, never shared. */
export function recentColours(): string[] {
  const raw = deviceStore().read(KEY) ?? ""
  return raw
    .split(",")
    .flatMap((hex) => normaliseHex(hex) ?? [])
    .slice(0, KEEP)
}

export function rememberColour(hex: string): void {
  const next = [hex, ...recentColours().filter((c) => c !== hex)].slice(0, KEEP)
  deviceStore().write(KEY, next.join(","))
}
