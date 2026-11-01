<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import type { PlayableSource } from "../domain/source.types"
  interface Props {
    sources: readonly PlayableSource[]
    index: number
    onchange: (index: number) => void
    onretry?: () => void
  }
  let { sources, index, onchange, onretry }: Props = $props()
</script>

{#if sources.length > 1}
  <label class="grid gap-1 type-sm"
    >Playback source
    <select
      class="rounded-md border bg-background p-2"
      value={index}
      onchange={(event) => onchange(Number(event.currentTarget.value))}
    >
      {#each sources as source, i (i)}
        <option value={i}
          >{source.providerData?.sourceProviderName ?? source.providerId} · {source.audioLanguages?.join(
            ", ",
          ) || "Audio language unknown"}{source.quality ? ` · ${source.quality}p` : ""}</option
        >
      {/each}
    </select>
  </label>
{/if}

{#if index >= sources.length && onretry}
  <Button variant="outline" onclick={onretry}>Retry playback</Button>
{/if}
