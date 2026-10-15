// Shared test inputs: sample leading bytes of each allowed type and a memory gate.
import type { Gate } from "../http/gate.ts"

export const bytes = (...values: (number | string)[]) =>
  new Uint8Array(
    values.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])),
  )

export const SAMPLES = {
  jpeg: bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10, "JFIF"),
  png: bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d),
  webp: bytes("RIFF", 0x24, 0, 0, 0, "WEBPVP8 "),
  pdf: bytes("%PDF-1.7\n"),
}

export const SPACE = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
export const IDEA = "1b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61"

/** Tokens are "<user>-token"; eve is never a member; each bucket counts per user. */
export function memoryGate(): Gate {
  const counts = new Map<string, number>()
  return {
    userFor: async (token) => (token.endsWith("-token") ? token.split("-")[0]! : null),
    isMember: async (token, space) => space === SPACE && !token.startsWith("eve"),
    consume: async (user, limit) => {
      const key = `${user}/${limit.bucket}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
      return (counts.get(key) ?? 0) <= limit.max
    },
  }
}
