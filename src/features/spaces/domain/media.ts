export const MEDIA_SLOTS = ["avatar", "cover"] as const
export type MediaSlot = (typeof MEDIA_SLOTS)[number]

export interface Size {
  readonly width: number
  readonly height: number
}

export interface Crop extends Size {
  readonly x: number
  readonly y: number
}

/** Pictures are re-encoded to these sizes: a square avatar and a 3:1 cover. */
export const MEDIA_SIZE: Readonly<Record<MediaSlot, Size>> = {
  avatar: { width: 512, height: 512 },
  cover: { width: 1800, height: 600 },
}

/** The bucket's limit per file. */
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024

/** Scales down so neither side exceeds `max`, keeping the shape; never enlarges. */
export function fitWithin(width: number, height: number, max: number): Size {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** The largest centred region of `aspect` (width / height) inside the image. */
export function centreCrop(width: number, height: number, aspect: number): Crop {
  const cropWidth = Math.min(width, Math.round(height * aspect))
  const cropHeight = Math.min(height, Math.round(cropWidth / aspect))
  return {
    x: Math.round((width - cropWidth) / 2),
    y: Math.round((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  }
}

/** A new object name for every upload: the bucket allows no overwrites. */
export const mediaPath = (spaceId: string, slot: MediaSlot, id: string) =>
  `${spaceId}/${slot}/${id}.webp`
