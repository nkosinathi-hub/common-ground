<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { Label } from "$lib/components/ui/label"
  import type { MemberRef } from "@/shared/domain"
  import { TO_HINT } from "../domain"

  interface Props {
    value: string
    members: readonly MemberRef[]
    /** "Something on my mind" goes to one person, never to everyone. */
    direct: boolean
  }

  let { value = $bindable(""), members, direct }: Props = $props()
</script>

<div class="grid gap-1.5">
  <Label for="note-to">To</Label>
  <NativeSelect id="note-to" bind:value aria-describedby={direct ? "note-to-hint" : undefined}>
    {#if direct}
      <option value="" disabled>Choose someone</option>
    {:else}
      <option value="">Everyone</option>
    {/if}
    {#each members as member (member.id)}
      <option value={member.id}>{member.displayName}</option>
    {/each}
  </NativeSelect>
  {#if direct}<p id="note-to-hint" class="text-xs text-muted-foreground">{TO_HINT}</p>{/if}
</div>
