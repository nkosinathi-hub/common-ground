<script lang="ts">
  import { onDestroy } from "svelte"
  import type { PlayerMediaProps } from "./player-media-props"
  import { captionPreference } from "./caption-pref"
  import { usePlayback } from "./context"
  import { LocalSubtitles } from "./local-subtitles"
  import { EMPTY_TRACKS, type EngineHandle } from "./media-tracks"
  import PlayerSurface from "./PlayerSurface.svelte"
  import TrackControls from "./TrackControls.svelte"
  let {
    source,
    title,
    autoplay = false,
    loading = false,
    captions = $bindable(),
    video = $bindable(null),
    onfail,
  }: PlayerMediaProps = $props()
  const { device } = usePlayback()
  const upload = new LocalSubtitles()
  let handle = $state.raw<EngineHandle | null>(null)
  let tracks = $state<ReturnType<EngineHandle["tracks"]>>(EMPTY_TRACKS)
  let audio = $state(device.read("playback-audio-language") ?? "en")
  let audioChoice = $state.raw<{ handle: EngineHandle; id: string } | null>(null)
  let restoreVersion = 0
  let selected = $state<string | undefined>()
  let error = $state("")
  const refresh = () => {
    tracks = handle?.tracks() ?? EMPTY_TRACKS
  }
  $effect(() => {
    handle?.setAudio(audio, audioChoice?.handle === handle ? audioChoice?.id : undefined)
    handle?.setCaptions(captions.on, captions.language, selected)
    captionPreference(device).write(captions)
    refresh()
  })
  async function restore(current: EngineHandle) {
    const version = ++restoreVersion
    try {
      const id = await upload.attach(current)
      if (version === restoreVersion && handle === current && id) {
        selected = id
        captions = { on: true, language: "en-x-local" }
        refresh()
      }
    } catch {
      error = "Could not load this subtitle file. Try another SRT or VTT file."
    }
  }
  $effect(() => {
    if (handle) void restore(handle)
  })
  $effect(() => {
    const element = video
    element?.addEventListener("loadeddata", refresh)
    element?.textTracks?.addEventListener?.("addtrack", refresh)
    return () => {
      element?.removeEventListener("loadeddata", refresh)
      element?.textTracks?.removeEventListener?.("addtrack", refresh)
    }
  })
  function chooseAudio(id: string) {
    const track = tracks.audio.find((t) => t.id === id)
    if (!track || !handle) return
    audioChoice = { handle, id }
    audio = track.language
    device.write("playback-audio-language", audio)
    handle.setAudio(audio, id)
    refresh()
  }
  function chooseText(id: string) {
    selected = id === "off" ? undefined : id
    const language = tracks.text.find((t) => t.id === id)?.language ?? captions.language
    captions = { on: id !== "off", language }
  }
  async function load(file: File) {
    error = ""
    try {
      await upload.load(file)
      if (handle) await restore(handle)
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Could not read the subtitle file"
    }
  }
  onDestroy(() => upload.dispose())
</script>

<PlayerSurface {loading} {autoplay} {source} {title} bind:video bind:handle {onfail} />
{#if source && source.kind !== "embed"}
  <TrackControls
    audio={tracks.audio}
    text={tracks.text}
    selected={selected ?? tracks.text.find((t) => t.active)?.id ?? tracks.text[0]?.id ?? "off"}
    captionsOn={captions.on}
    {error}
    onaudio={chooseAudio}
    ontext={chooseText}
    onfile={(file) => void load(file)}
  />
{/if}
