export const TEMPLATE_IDS = ["couple", "friends", "family", "blank"] as const
export type SpaceTemplateId = (typeof TEMPLATE_IDS)[number]

export interface SpaceTemplate {
  readonly id: SpaceTemplateId
  readonly label: string
  readonly audience: string
  readonly description: string
  readonly suggestedName: string
  readonly headline: string
  readonly welcome: string
  readonly invitation: string
}

export const SPACE_TEMPLATES: readonly SpaceTemplate[] = [
  {
    id: "couple",
    label: "Couples",
    audience: "You and your partner",
    description: "Date nights, shared dreams, and your own little world.",
    suggestedName: "Our little world",
    headline: "Our favourite place.",
    welcome: "Save a story for date night.",
    invitation: "Give your shared dreams a place to grow.",
  },
  {
    id: "friends",
    label: "Friends",
    audience: "You and your friends",
    description: "Movie nights, group projects, and all the good chaos.",
    suggestedName: "The hangout",
    headline: "Same crew.",
    welcome: "Line up your next movie night.",
    invitation: "Make something great with your favourite people.",
  },
  {
    id: "family",
    label: "Family",
    audience: "Your family circle",
    description: "Family favourites and little plans that bring you closer.",
    suggestedName: "Family corner",
    headline: "A place for everyone.",
    welcome: "Find a story the whole family will love.",
    invitation: "Turn a little family idea into your next adventure.",
  },
  {
    id: "blank",
    label: "Make it your own",
    audience: "Any kind of circle",
    description: "A calm, open space. You decide what it becomes.",
    suggestedName: "Our shared space",
    headline: "A shared space.",
    welcome: "Save a story for your next quiet night.",
    invitation: "Give that 'what if' a place to grow.",
  },
]

export function templateFor(id: string | null | undefined): SpaceTemplate {
  return SPACE_TEMPLATES.find((t) => t.id === id) ?? SPACE_TEMPLATES[3]!
}
