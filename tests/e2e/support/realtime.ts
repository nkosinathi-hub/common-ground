import type { Page } from "@playwright/test"

interface Frame {
  ref: string | null
  topic: string
  event: string
  status?: string
}

/** Reads a Phoenix frame in either the v1 object or the v2 array serialization. */
function frame(payload: string | Buffer): Frame | null {
  try {
    const raw = JSON.parse(String(payload)) as unknown
    if (Array.isArray(raw)) {
      const [, ref, topic, event, body] = raw as [
        unknown,
        string,
        string,
        string,
        { status?: string },
      ]
      return { ref, topic, event, status: body?.status }
    }
    const msg = raw as { ref: string; topic: string; event: string; payload?: { status?: string } }
    return { ref: msg.ref, topic: msg.topic, event: msg.event, status: msg.payload?.status }
  } catch {
    return null
  }
}

/**
 * Resolves once the page's Realtime socket confirms a join to a channel whose topic starts with
 * `realtime:<prefix>`. Call it before the page opens the socket (before signing in).
 */
export function realtimeJoined(page: Page, prefix: string): Promise<void> {
  return new Promise((resolve) => {
    page.on("websocket", (socket) => {
      const joins = new Set<string>()
      socket.on("framesent", ({ payload }) => {
        const sent = frame(payload)
        if (sent?.event === "phx_join" && sent.topic.startsWith(`realtime:${prefix}`))
          joins.add(sent.ref ?? "")
      })
      socket.on("framereceived", ({ payload }) => {
        const got = frame(payload)
        if (got?.event === "phx_reply" && joins.has(got.ref ?? "") && got.status === "ok") resolve()
      })
    })
  })
}
