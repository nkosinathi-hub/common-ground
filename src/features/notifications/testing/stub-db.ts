export interface Reply {
  readonly data: unknown
  readonly error: { code?: string; message?: string; status?: number } | null
}

const BUILDER = [
  "from",
  "select",
  "insert",
  "update",
  "delete",
  "eq",
  "in",
  "is",
  "or",
  "order",
  "single",
]

/**
 * Stand-in for the Supabase client: records every builder call and answers each awaited
 * query or RPC with the next reply. Signed in as `userId` unless it is null. Adapter tests
 * pass `db` where the client goes (`db as Db`).
 */
export function stubDb(replies: Reply[], userId: string | null = "u1") {
  const calls: unknown[][] = []
  const next = () => replies.shift() ?? { data: null, error: null }
  const chain: Record<string, unknown> = {}
  for (const name of [...BUILDER, "limit"]) {
    chain[name] = (...args: unknown[]) => {
      calls.push([name, ...args])
      return chain
    }
  }
  chain.then = (resolve: (reply: Reply) => void) => resolve(next())
  // Replies are handed out when awaited, in the order the adapter awaits them.
  const rpc = (...args: unknown[]) => {
    calls.push(["rpc", ...args])
    return { then: (resolve: (reply: Reply) => void) => resolve(next()) }
  }
  const user = userId ? { id: userId } : null
  const auth = { getUser: async () => ({ data: { user }, error: null }) }
  const db: unknown = { from: chain.from, rpc, auth }
  return { db, calls }
}
