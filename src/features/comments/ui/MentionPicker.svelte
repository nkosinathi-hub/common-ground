<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import type { MemberRef } from "@/shared/domain"
  import type { ComposerState } from "./composer.svelte"

  interface Props {
    composer: ComposerState
    members: readonly MemberRef[]
    me: string
    onDone: () => void
  }
  let { composer, members, me, onDone }: Props = $props()

  const options = $derived(composer.candidates(members, me))
  let input = $state<HTMLInputElement | null>(null)
  $effect(() => input?.focus())

  function choose(id: string) {
    composer.choose(id)
    onDone()
  }

  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault()
      composer.closePicker()
      onDone()
    } else if (event.key === "Enter") {
      event.preventDefault()
      const first = options[0]
      if (first) choose(first.id)
    }
  }
</script>

<div class="grid gap-2 rounded-lg border p-2" role="group" aria-label="Mention a member">
  <Input
    bind:ref={input}
    type="search"
    aria-label="Find a member"
    placeholder="Find a member"
    bind:value={composer.query}
    onkeydown={keydown}
  />
  {#if options.length === 0}
    <p class="px-2 text-sm text-muted-foreground">No one else to mention</p>
  {:else}
    <ul class="grid" aria-label="Members">
      {#each options as member (member.id)}
        <li>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="w-full justify-start"
            onclick={() => choose(member.id)}>{member.displayName}</Button
          >
        </li>
      {/each}
    </ul>
  {/if}
</div>
