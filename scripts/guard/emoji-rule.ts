export interface EmojiHit {
  readonly path: string
  readonly line: number
}

const EMOJI = /\p{Extended_Pictographic}/u

/** No emojis anywhere in tracked text; icons come from @lucide/svelte. */
export function findEmoji(files: readonly { path: string; text: string }[]): EmojiHit[] {
  return files.flatMap((file) =>
    file.text
      .split("\n")
      .flatMap((text, index) => (EMOJI.test(text) ? [{ path: file.path, line: index + 1 }] : [])),
  )
}
