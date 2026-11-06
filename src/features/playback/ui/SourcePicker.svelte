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
  <details class="relative max-w-full self-end type-sm">
    <summary class="cursor-pointer rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"
      >Playback options</summary
    >
    <div class="w-80 max-w-full p-related">
      <label class="grid gap-1 type-sm"
        >Playback source
        <select
          class="w-full max-w-full min-w-0 rounded-md border bg-background p-2 text-base"
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
    </div>
  </details>
{/if}

{#if index >= sources.length && onretry}
  <Button variant="outline" onclick={onretry}>Retry playback</Button>
{/if}
