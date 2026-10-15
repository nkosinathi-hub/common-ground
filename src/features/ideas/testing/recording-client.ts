/** One reply from PostgREST: the data or the error. */
export interface Reply {
  readonly data: unknown
  readonly error: unknown
}

/**
 * Stand-in for the typed Supabase client in adapter tests: every builder call (from, select, eq,
 * rpc...) is recorded as [method, ...args], and awaiting the chain answers with the reply.
 */
export function recordingClient(reply: Reply) {
  const calls: unknown[][] = []
  const chain: object = new Proxy(
    {},
    {
      get: (_target, method) =>
        method === "then"
          ? (resolve: (value: Reply) => void) => resolve(reply)
          : (...args: unknown[]) => {
              calls.push([method, ...args])
              return chain
            },
    },
  )
  return { calls, client: chain }
}
