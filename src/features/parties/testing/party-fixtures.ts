import { initialParty, reduce, type Presence } from "../domain/party-machine"

/** A present member; the host joined first. */
const person = (userId: string, ready = true, buffering = false): Presence => ({
  userId,
  ready,
  buffering,
  joinedAt: `2026-10-22T20:00:0${userId === "host" ? 0 : 1}Z`,
})

/** The host and a guest, with the guest's presence overridden. */
export const both = (guest: Partial<Presence> = {}) => [
  person("host"),
  { ...person("guest"), ...guest },
]

export const lobby = (people = both()) =>
  reduce(initialParty("host"), { type: "presence", people, at: 0 })

export const command = (
  by: string,
  action: "play" | "pause" | "seek",
  position: number,
  at: number,
) => ({ type: "command", by, action, position, at }) as const

/** Started by the host at shared time 1000 from the beginning. */
export const live = () => reduce(lobby(), command("host", "play", 0, 1000))
