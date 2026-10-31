import { centreCrop, fitWithin, MEDIA_SIZE, type MediaSlot } from "../domain/media"

const QUALITY = 0.85

const encode = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY))

/** The background keeps its whole picture; its focal point decides what shows (CSS). */
const KEEPS_SHAPE: ReadonlySet<MediaSlot> = new Set(["background"])

/**
 * Centre-crops a picture to its slot's shape (except the background), scales it down and re-encodes it in a canvas. The
 * new file carries no EXIF (location, camera) and only pixels the canvas drew. WebP where the
 * browser can encode it, JPEG otherwise.
 */
export async function resizeImage(file: Blob, slot: MediaSlot): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const target = MEDIA_SIZE[slot]
  const crop = KEEPS_SHAPE.has(slot)
    ? { x: 0, y: 0, width: bitmap.width, height: bitmap.height }
    : centreCrop(bitmap.width, bitmap.height, target.width / target.height)
  const size = fitWithin(crop.width, crop.height, Math.max(target.width, target.height))
  const canvas = document.createElement("canvas")
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("This browser cannot prepare pictures")
  context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height)
  bitmap.close()
  const webp = await encode(canvas, "image/webp")
  if (webp?.type === "image/webp") return webp
  const jpeg = await encode(canvas, "image/jpeg")
  if (!jpeg) throw new Error("This browser cannot prepare pictures")
  return jpeg
}
