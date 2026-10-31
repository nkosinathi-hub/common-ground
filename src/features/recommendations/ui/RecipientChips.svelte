<script lang="ts">
  import { Check } from "@lucide/svelte"
  import type { MemberRef } from "@/shared/domain"
  import { Chip, FormError } from "@/shared/ui"

  interface Props {
    options: readonly MemberRef[]
    chosen: readonly string[]
    error?: string
    ontoggle: (id: string) => void
  }

  let { options, chosen, error, ontoggle }: Props = $props()
</script>

<!-- Figma S09 "Send to": one chip per member, any number chosen. -->
<fieldset class="flex flex-col gap-related">
  <legend class="mb-related type-label text-foreground">Send to</legend>
  <div class="flex flex-wrap gap-related">
    {#each options as member (member.id)}
      {@const on = chosen.includes(member.id)}
      <Chip selected={on} icon={on ? Check : undefined} onclick={() => ontoggle(member.id)}
        >{member.displayName}</Chip
      >
    {/each}
  </div>
  {#if error}<FormError message={error} />
  {:else}<p class="type-sm text-muted-foreground">Choose one or more people.</p>{/if}
</fieldset>
