<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Chip, FormField } from "@/shared/ui"
  import { feelingSuggestions, readFeelings, writeFeelings } from "../domain"

  /** The stored "How I feel" line: chips and own words are read from it and written back. */
  let { value = $bindable("") }: { value: string } = $props()
  const parts = $derived(readFeelings(value))
  const set = (words: readonly string[], own = parts.own) => (value = writeFeelings({ words, own }))
</script>

<!-- Figma S02b How I feel: the chosen words, your own, then words to borrow. -->
{#if parts.words.length}
  <ul class="flex flex-wrap gap-related" aria-label="Chosen feelings">
    {#each parts.words as word (word)}
      <li>
        <Chip selected label={word} onremove={() => set(parts.words.filter((w) => w !== word))}
          >{word}</Chip
        >
      </li>
    {/each}
  </ul>
{/if}
<FormField id="hard-talk-feel" label="In my own words">
  {#snippet control({ id })}
    <Input
      {id}
      placeholder="A word or two is plenty"
      value={parts.own}
      oninput={(event) => set(parts.words, event.currentTarget.value)}
    />
  {/snippet}
</FormField>
<div class="flex flex-col gap-related">
  <p id="feeling-words" class="type-label-sm text-muted-foreground">Need a word?</p>
  <ul class="flex flex-wrap gap-related" aria-labelledby="feeling-words">
    {#each feelingSuggestions(parts.words) as word (word)}
      <li><Chip onclick={() => set([...parts.words, word])}>{word}</Chip></li>
    {/each}
  </ul>
</div>
