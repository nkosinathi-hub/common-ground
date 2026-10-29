import { memberName, type MemberRef } from "@/shared/domain"

/** The episode a title comment is about: the author's place when they wrote it. */
export interface EpisodeTag {
  readonly season: number
  readonly episode: number
}

/** Past your place. Before you start a series, every tagged comment is ahead of you. */
export function isAhead(tag: EpisodeTag | null, place: EpisodeTag | null): boolean {
  if (!tag) return false
  if (!place) return true
  return tag.season > place.season || (tag.season === place.season && tag.episode > place.episode)
}

export const visibleTo =
  (place: EpisodeTag | null) =>
  (comment: { tag: EpisodeTag | null }): boolean =>
    !isAhead(comment.tag, place)

const list = (items: readonly string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`

/** "Ben is ahead. 2 comments about E4 and E5 are hidden." Seasons show only when they differ. */
export function hiddenNotice(
  hidden: readonly { authorId: string | null; tag: EpisodeTag | null }[],
  authors: readonly MemberRef[],
): string | null {
  const tags = hidden.flatMap((h) => (h.tag ? [h.tag] : []))
  if (tags.length === 0) return null
  const seasons = new Set(tags.map((t) => t.season))
  const label = (t: EpisodeTag) =>
    seasons.size > 1 || t.season !== 1 ? `S${t.season}E${t.episode}` : `E${t.episode}`
  const episodes = [...new Map(tags.map((t) => [`${t.season}:${t.episode}`, t])).values()]
    .sort((a, b) => a.season - b.season || a.episode - b.episode)
    .map(label)
  const people = [...new Set(hidden.map((h) => memberName(authors, h.authorId)))]
  const who =
    people.length > 2
      ? `${people.length} people are`
      : `${list(people)} ${people.length === 1 ? "is" : "are"}`
  const count = `${tags.length} ${tags.length === 1 ? "comment" : "comments"}`
  return `${who} ahead. ${count} about ${list(episodes)} ${tags.length === 1 ? "is" : "are"} hidden.`
}

/** What a title's discussion knows: your place, and how many episodes your season has. */
export interface EpisodeContext {
  readonly place: { readonly season: number | null; readonly episode: number | null } | null
  readonly episodeCount: number
}

/** Your place as a tag, or null before you start. */
export const placeOf = (context: EpisodeContext): EpisodeTag | null =>
  context.place?.season != null && context.place.episode != null
    ? { season: context.place.season, episode: context.place.episode }
    : null
