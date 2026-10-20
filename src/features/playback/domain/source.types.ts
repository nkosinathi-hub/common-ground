/** What a provider can hand the player. Pure data, checked against the provider's own policy. */
export type SourceKind = "hls" | "dash" | "file" | "embed"
export type SegmentKind = "intro" | "credits" | "recap" | "preview"

export interface Segment {
  readonly kind: SegmentKind
  readonly start: number
  readonly end: number
}

export interface Subtitle {
  readonly url: string
  readonly language: string
  readonly label: string
}

export interface PlayableSource {
  readonly kind: SourceKind
  readonly url: string
  readonly mime?: string
  /** Vertical resolution in lines, e.g. 1080; higher ranks first among equals. */
  readonly quality?: number
  /** Text tracks as WebVTT; image subtitles are burned in by the server instead. */
  readonly subtitles: readonly Subtitle[]
  readonly segments: readonly Segment[]
  readonly providerId: string
  /** ISO instant after which the URL stops working. */
  readonly expiresAt?: string
  /** Headers sent only to the source's own origin, so no token ever sits in a URL. */
  readonly requestHeaders?: Readonly<Record<string, string>>
  /** Where the viewer stopped last time, in seconds; the provider's value is canonical. */
  readonly resumeSeconds?: number
  /** A file holding several episodes reports the range it covers. */
  readonly episodes?: { readonly from: number; readonly to: number }
  /** Sandbox tokens for an embed, copied from the provider's declared policy. */
  readonly sandbox?: readonly string[]
  /** Opaque ids the provider needs back in its progress reports (item, session). */
  readonly providerData?: Readonly<Record<string, string>>
}
