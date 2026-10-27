import { CalendarDays, Clapperboard, Home, Lightbulb, NotebookPen, Settings2 } from "@lucide/svelte"

export const demoNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "watch", label: "Watchlist", icon: Clapperboard },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notes", label: "Notes & discussion", icon: NotebookPen },
  { id: "settings", label: "Space settings", icon: Settings2 },
] as const

export type DemoSection = (typeof demoNav)[number]["id"]

export const demoTitles = [
  {
    name: "Ted Lasso",
    kind: "Series",
    year: 2020,
    art: "TL",
    colour: "bg-amber-100",
    rating: "8.8",
  },
  {
    name: "The Bear",
    kind: "Series",
    year: 2022,
    art: "TB",
    colour: "bg-orange-100",
    rating: "8.6",
  },
  { name: "Arrival", kind: "Movie", year: 2016, art: "◉", colour: "bg-indigo-100", rating: "7.9" },
  { name: "Bluey", kind: "Series", year: 2018, art: "BY", colour: "bg-sky-100", rating: "9.4" },
]

export const demoEpisodes = [
  { name: "Goodbye Earl", duration: "32 min", watched: true },
  { name: "Move the Ball", duration: "31 min", watched: true },
  { name: "Do the Right-est Thing", duration: "30 min", watched: false },
  { name: "Carol of the Bells", duration: "30 min", watched: false },
]

export const demoIdeas = [
  { title: "A weekend in the Cederberg", stage: "Exploring" },
  { title: "Make a tiny garden", stage: "Researching" },
  { title: "Start a family recipe book", stage: "In progress" },
  { title: "See the winter stars", stage: "Ready" },
]

export const demoEvents = [
  { date: "TODAY · 18:30", title: "Pick a film together", place: "Living room" },
  { date: "SAT, 24 OCT · 09:00", title: "Market and coffee", place: "Neighbourgoods Market" },
  { date: "SUN, 25 OCT · 16:00", title: "Plan the Cederberg trip", place: "At home" },
]

export const demoNotes = [
  {
    name: "Ana",
    initial: "A",
    when: "Today, 10:14",
    text: "I found a lovely campsite near the river. Adding it to our trip idea!",
    replies: 2,
  },
  {
    name: "Ben",
    initial: "B",
    when: "Yesterday",
    text: "The new episode was so good. Let's save the next one for Friday?",
    replies: 1,
  },
  {
    name: "Ana",
    initial: "A",
    when: "Monday",
    text: "Grandma's tomato bredie recipe is in my notes. I'll type it up this weekend.",
    replies: 0,
  },
]
