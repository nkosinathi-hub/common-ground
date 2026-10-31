<script lang="ts">
  import { X } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { memberName, type MemberRef } from "@/shared/domain"
  import type { ComposerState } from "./composer-state.svelte"

  let { composer, members }: { composer: ComposerState; members: readonly MemberRef[] } = $props()
</script>

{#if composer.mentionIds.length > 0}
  <ul class="flex flex-wrap gap-hairline" aria-label="Mentioning">
    {#each composer.mentionIds as mentioned (mentioned)}
      <li>
        <Badge variant="secondary">
          @{memberName(members, mentioned)}
          <button
            type="button"
            aria-label={`Do not mention ${memberName(members, mentioned)}`}
            onclick={() => composer.unmention(mentioned)}><X class="size-3" /></button
          >
        </Badge>
      </li>
    {/each}
  </ul>
{/if}
