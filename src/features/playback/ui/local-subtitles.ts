import { SUBTITLE_MAX_BYTES, subtitleVtt } from "../domain/subtitle-file"
import type { EngineHandle } from "./media-tracks"

/** One device-local file per player. Re-selecting its contents never adds duplicate tracks. */
export class LocalSubtitles {
  private url: string | null = null
  private text = ""
  private label = ""
  private version = 0
  private attached = new WeakMap<EngineHandle, { text: string; id: Promise<string> }>()

  async load(file: File): Promise<void> {
    const version = ++this.version
    if (file.size > SUBTITLE_MAX_BYTES) throw new Error("Subtitle files must be 2 MB or smaller")
    const result = subtitleVtt(file.name, await file.text())
    if (version !== this.version) return
    if (!result.ok) throw new Error(result.error.message)
    if (result.value === this.text) return
    this.release()
    this.text = result.value
    this.label = file.name
    this.url = URL.createObjectURL(new Blob([this.text], { type: "text/vtt" }))
  }

  async attach(handle: EngineHandle): Promise<string | null> {
    if (!this.url) return null
    const previous = this.attached.get(handle)
    if (previous?.text === this.text) return previous.id
    const id = handle.addSubtitle({ url: this.url, label: this.label, language: "en-x-local" })
    this.attached.set(handle, { text: this.text, id })
    try {
      return await id
    } catch (error) {
      this.attached.delete(handle)
      throw error
    }
  }

  private release() {
    if (this.url) URL.revokeObjectURL(this.url)
    this.url = null
  }

  dispose(): void {
    this.version++
    this.release()
    this.text = ""
  }
}
