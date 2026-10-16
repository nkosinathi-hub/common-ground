<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import type { MemberRef } from "@/shared/domain"
  import { TO_HINT } from "../domain"

  interface Props {
    value: string
    members: readonly MemberRef[]
    /** "Something on my mind" goes to one person, never to everyone. */
    direct: boolean
    select: string
  }

  let { value = $bindable(""), members, direct, select }: Props = $props()
</script>

<div class="grid gap-1.5">
  <Label for="note-to">To</Label>
  <select
    id="note-to"
    class={select}
    bind:value
    aria-describedby={direct ? "note-to-hint" : undefined}
  >
    {#if direct}
      <option value="" disabled>Choose someone</option>
    {:else}
      <option value="">Everyone</option>
    {/if}
    {#each members as member (member.id)}
      <option value={member.id}>{member.displayName}</option>
    {/each}
  </select>
  {#if direct}<p id="note-to-hint" class="text-xs text-muted-foreground">{TO_HINT}</p>{/if}
</div>
