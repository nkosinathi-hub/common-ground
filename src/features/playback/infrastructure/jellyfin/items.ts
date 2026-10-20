/** The few Jellyfin item fields the adapter reads, parsed defensively. */
export interface JellyfinItem {
  readonly Id: string
  readonly Type: string
  readonly Name?: string
  readonly ProviderIds?: { readonly Tmdb?: string }
  readonly ParentIndexNumber?: number
  readonly IndexNumber?: number
  readonly IndexNumberEnd?: number
  readonly UserData?: { readonly PlaybackPositionTicks?: number }
}

const isItem = (value: unknown): value is JellyfinItem => {
  const item = value as Partial<JellyfinItem> | null
  return typeof item?.Id === "string" && typeof item.Type === "string"
}

export function itemsOf(body: unknown): JellyfinItem[] {
  const list = (body as { Items?: unknown } | null)?.Items
  return Array.isArray(list) ? list.filter(isItem) : []
}
