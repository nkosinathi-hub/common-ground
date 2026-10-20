type Listener = (event: { payload?: unknown }) => void

/** Stands in for supabase-js Realtime in adapter tests: one channel, recorded calls. */
export function fakeRealtime() {
  const calls: unknown[][] = []
  const listeners = new Map<string, Listener>()
  let onStatus: (status: string) => void = () => undefined
  let heartbeat: (status: string) => void = () => undefined
  const presence: Record<string, unknown[]> = {}
  const channel = {
    state: "joined",
    on(type: string, filter: { event: string }, listener: Listener) {
      calls.push(["on", type, filter])
      listeners.set(`${type}:${filter.event}`, listener)
      return channel
    },
    subscribe(callback: (status: string) => void) {
      onStatus = callback
      return channel
    },
    send: (message: unknown) => calls.push(["send", message]),
    track: (state: unknown) => calls.push(["track", state]),
    presenceState: () => presence,
  }
  let connected = true
  const realtime = {
    setAuth: () => Promise.resolve(calls.push(["setAuth"])).then(() => undefined),
    onHeartbeat: (callback: (status: string) => void) => (heartbeat = callback),
    isConnected: () => connected,
    connect: () => calls.push(["connect"]),
  }
  const db = {
    realtime,
    channel: (topic: string, options: unknown) => (
      calls.push(["channel", topic, options]),
      channel
    ),
    removeChannel: (c: unknown) => Promise.resolve(calls.push(["removeChannel", c === channel])),
  }
  return {
    db,
    calls,
    channel,
    status: (status: string) => onStatus(status),
    heartbeat: (status: string) => heartbeat(status),
    broadcast: (payload: unknown) => listeners.get("broadcast:party")?.({ payload }),
    presence: (state: Record<string, unknown[]>) => {
      for (const key of Object.keys(presence)) delete presence[key]
      Object.assign(presence, state)
      listeners.get("presence:sync")?.({})
    },
    disconnect: () => (connected = false),
  }
}
