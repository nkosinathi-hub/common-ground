export type MemberAction = "remove" | "transfer"

export interface MemberActionCopy {
  readonly title: (name: string) => string
  readonly description: string
  readonly confirmLabel: string
  readonly destructive: boolean
  readonly done: (name: string) => string
}

/** What the owner is asked, and told afterwards, for each change to a member. */
export const MEMBER_ACTIONS: Readonly<Record<MemberAction, MemberActionCopy>> = {
  remove: {
    title: (name) => `Remove ${name}?`,
    description:
      'They lose access to everything in this space right away. What they wrote stays: it shows their name to anyone who still shares another space with them, and "Former member" to everyone else.',
    confirmLabel: "Remove",
    destructive: true,
    done: (name) => `${name} was removed`,
  },
  transfer: {
    title: (name) => `Hand ownership to ${name}?`,
    description:
      "You become a regular member. Only the owner manages members and can delete the space.",
    confirmLabel: "Transfer",
    destructive: false,
    done: (name) => `${name} now owns this space`,
  },
}
