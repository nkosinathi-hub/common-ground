/** The parts of PeerTube's `GET /api/v1/videos/{id}` this adapter reads. */
export interface ApiVideo {
  readonly uuid?: string
  readonly shortUUID?: string
  readonly isLive?: boolean
  readonly privacy?: { readonly id?: number }
  readonly state?: { readonly id?: number }
  readonly licence?: { readonly id?: number | null }
  readonly files?: readonly ApiFile[]
  readonly streamingPlaylists?: readonly {
    readonly playlistUrl?: string
    readonly files?: readonly ApiFile[]
  }[]
}

export interface ApiFile {
  readonly fileUrl?: string
  readonly resolution?: { readonly id?: number }
}

export interface ApiCaption {
  readonly language?: { readonly id?: string; readonly label?: string }
  readonly fileUrl?: string
  readonly captionPath?: string
}
