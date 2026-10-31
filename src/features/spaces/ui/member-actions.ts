export type MemberAction = "remove" | "makeOwner" | "removeOwner"

export interface MemberActionCopy {
  readonly title: (name: string) => string
  readonly description: string
  readonly confirmLabel: string
  readonly destructive: boolean
  readonly done: (name: string) => string
}

/** What an owner is asked, and told afterwards, for each change to a member. */
export const MEMBER_ACTIONS: Readonly<Record<MemberAction, MemberActionCopy>> = {
  remove: {
    title: (name) => `Remove ${name}?`,
    description:
      'They lose access to everything in this space right away. What they wrote stays: it shows their name to anyone who still shares another space with them, and "Former member" to everyone else.',
    confirmLabel: "Remove",
    destructive: true,
    done: (name) => `${name} was removed`,
  },
  makeOwner: {
    title: (name) => `Make ${name} an owner?`,
    description:
      "Owners manage members, invitations and settings, and can delete the space. You stay an owner too.",
    confirmLabel: "Make owner",
    destructive: false,
    done: (name) => `${name} is now an owner`,
  },
  removeOwner: {
    title: (name) => `Remove ${name} as an owner?`,
    description: "They stay in the space as a member. The space always keeps at least one owner.",
    confirmLabel: "Remove as owner",
    destructive: false,
    done: (name) => `${name} is now a member`,
  },
}
