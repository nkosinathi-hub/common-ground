import type { PrivacyPart } from "@/shared/domain"

export interface NoticeSection {
  readonly id: string
  readonly part: PrivacyPart
  readonly title: string
  readonly paragraphs: readonly string[]
}

/** The POPIA notice (D20a, D20b), in two parts: what we keep, then what you can do about it. */
export const NOTICE: readonly NoticeSection[] = [
  {
    id: "store",
    part: "store",
    title: "What we store",
    paragraphs: [
      "Your email address and password (hashed) for signing in. Other members never see your email.",
      "Your display name, shown only to members of spaces you belong to.",
      "What you add: titles, progress, likes and dislikes, comments, ideas, tasks, budgets and files.",
    ],
  },
  {
    id: "who",
    part: "store",
    title: "Who can see it",
    paragraphs: [
      "Only current members of the space it belongs to. Removed members lose access immediately. There are no public profiles, no advertising and no analytics trackers.",
    ],
  },
  {
    id: "third",
    part: "store",
    title: "Third parties",
    paragraphs: [
      "Data is hosted by Supabase. Title search and streaming availability come from TMDB and JustWatch; your searches are sent to TMDB through our server without your identity. If you connect Simkl, we keep only the access keys it gives us, read your Simkl watch history to tick titles on your lists, and send Simkl nothing. Disconnecting revokes and deletes them.",
    ],
  },
  {
    id: "rights",
    part: "rights",
    title: "Your rights",
    paragraphs: [
      'From Account and data you can download everything about you, download a space\'s content, and delete your account. Deleting your account removes your personal information; content you wrote in shared spaces stays, credited to "Former member". If you leave or are removed from a space, what you wrote there shows your name only to people who still share another space with you.',
    ],
  },
  {
    id: "export",
    part: "rights",
    title: "Exporting your data",
    paragraphs: [
      '"Download my data" gives you a JSON file with your profile, your sign-in email, the spaces you belong to and how much you have added to each kind of content.',
      "Any member can export a space they belong to: its details, the members' display names and everything added there. Exports never include invite links, notifications or file download links, and nobody else's email address.",
    ],
  },
  {
    id: "delete",
    part: "rights",
    title: "Deleting your account",
    paragraphs: [
      "You confirm with your password and by typing DELETE. It cannot be undone.",
      "If you own a space other people still belong to, make someone else the owner or delete that space first. Spaces where you are the only member are deleted with your account.",
      "Your profile, sign-in details and memberships are removed straight away. What you wrote in shared spaces stays for the other members, without your name.",
    ],
  },
]
