<script lang="ts">
  import type { MediaTrack } from "./media-tracks"
  interface Props {
    audio: MediaTrack[]
    text: MediaTrack[]
    selected: string
    captionsOn: boolean
    error: string
    onaudio: (id: string) => void
    ontext: (id: string) => void
    onfile: (file: File) => void
  }
  let props: Props = $props()
</script>

<details class="max-w-full self-end type-sm">
  <summary class="cursor-pointer rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"
    >Audio and subtitles</summary
  >
  <div class="flex flex-wrap items-end gap-related p-related" aria-label="Audio and subtitles">
    {#if props.audio.length}
      <label class="grid max-w-full min-w-0 gap-1 type-sm"
        >Audio language
        <select
          class="w-60 max-w-full min-w-0 rounded-md border bg-background p-2 text-base"
          value={props.audio.find((t) => t.active)?.id}
          onchange={(e) => props.onaudio(e.currentTarget.value)}
        >
          {#each props.audio as track (track.id)}<option value={track.id}
              >{track.label} ({track.language})</option
            >{/each}
        </select>
      </label>
    {/if}
    <label class="grid max-w-full min-w-0 gap-1 type-sm"
      >Subtitles
      <select
        class="w-60 max-w-full min-w-0 rounded-md border bg-background p-2 text-base"
        value={props.captionsOn ? props.selected : "off"}
        onchange={(e) => props.ontext(e.currentTarget.value)}
      >
        <option value="off">Off</option>
        {#each props.text as track (track.id)}<option value={track.id}>{track.label}</option>{/each}
      </select>
    </label>
    <label class="grid max-w-full min-w-0 gap-1 type-sm"
      >Load subtitle file
      <input
        type="file"
        accept=".srt,.vtt,text/vtt,application/x-subrip"
        class="max-w-64 type-sm"
        onchange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) props.onfile(file)
          e.currentTarget.value = ""
        }}
      />
    </label>
    <p class="w-full type-xs text-muted-foreground">
      SRT or VTT, up to 2 MB. Files stay on this device.
    </p>
    {#if props.error}<p class="w-full type-sm text-destructive" role="alert">{props.error}</p>{/if}
  </div>
</details>
