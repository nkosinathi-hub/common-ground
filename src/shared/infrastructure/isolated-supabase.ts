import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

/** Memory-only auth and a supplied transport, with no realtime socket. */
export function isolatedSupabase(origin: string, fetcher: typeof fetch, session: object) {
  const values = new Map([["demo-session", JSON.stringify(session)]])
  const db = createClient<Database>(origin, "sample-public-key", {
    global: { fetch: fetcher },
    auth: {
      storageKey: "demo-session",
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
          values.set(key, value)
        },
        removeItem: (key) => {
          values.delete(key)
        },
      },
    },
    realtime: { worker: false },
  })
  // Production subscriptions are retained, but a demo never opens a realtime socket.
  const channel = db.channel.bind(db)
  db.channel = (...args) => {
    const result = channel(...args)
    result.subscribe = () => result
    return result
  }
  return db
}
