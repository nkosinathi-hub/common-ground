<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { FilePen } from "@lucide/svelte"
  import { draftLabel, type Draft } from "../domain"

  interface Props {
    drafts: readonly Draft[]
    onOpen: (draft: Draft) => void
  }

  let { drafts, onOpen }: Props = $props()
  const now = new Date()
</script>

{#if drafts.length > 0}
  <section class="grid gap-1" aria-labelledby="your-drafts">
    <h3 id="your-drafts" class="text-sm font-medium">Your drafts ({drafts.length})</h3>
    <ul class="grid gap-1">
      {#each drafts as draft (draft.id)}
        <li>
          <Button
            variant="ghost"
            size="sm"
            class="min-h-11 w-full justify-start"
            onclick={() => onOpen(draft)}
            ><FilePen aria-hidden="true" />{draftLabel(draft, now)}</Button
          >
        </li>
      {/each}
    </ul>
  </section>
{/if}
