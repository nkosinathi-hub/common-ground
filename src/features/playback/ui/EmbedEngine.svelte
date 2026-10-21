<script lang="ts">
  import type { PlayableSource } from "../domain/source.types"

  interface Props {
    source: PlayableSource
    title: string
  }

  let { source, title }: Props = $props()
  // Only the tokens the provider's policy declared (validateSource stamps them); never
  // allow-top-navigation, and allow-popups only when the plugin asked for it.
  const sandbox = $derived((source.sandbox ?? []).join(" "))
</script>

<iframe
  class="h-full w-full border-0 bg-black"
  src={source.url}
  {title}
  {sandbox}
  referrerpolicy="strict-origin"
  allow="fullscreen; picture-in-picture; encrypted-media"
  allowfullscreen
  loading="lazy"
></iframe>
