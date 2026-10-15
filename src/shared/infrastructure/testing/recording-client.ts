import type { QueryError } from "../query"

/** One reply from PostgREST: the data or the error. */
export interface Reply {
  readonly data: unknown
  readonly error: QueryError | null
}

const EMPTY: Reply = { data: null, error: null }

/**
 * Stand-in for the typed Supabase client in adapter tests: every builder call (from, select, eq,
 * rpc...) is recorded as [method, ...args]. One reply answers every await; a list answers each
 * await in turn, then empty replies. Signed in as `userId` unless it is null. Adapter tests pass
 * `client` where the client goes (`client as Db`).
 */
export function recordingClient(replies: Reply | readonly Reply[], userId: string | null = "u1") {
  const queue = Array.isArray(replies) ? [...(replies as readonly Reply[])] : null
  const next = () => (queue ? (queue.shift() ?? EMPTY) : (replies as Reply))
  const user = userId ? { id: userId } : null
  const auth = { getUser: async () => ({ data: { user }, error: null }) }
  const calls: unknown[][] = []
  const chain: object = new Proxy(
    {},
    {
      get: (_target, method) => {
        if (method === "auth") return auth
        if (method === "then") return (resolve: (value: Reply) => void) => resolve(next())
        return (...args: unknown[]) => {
          calls.push([method, ...args])
          return chain
        }
      },
    },
  )
  return { calls, client: chain }
}
