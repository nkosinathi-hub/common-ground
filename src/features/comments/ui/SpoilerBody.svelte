<script lang="ts">
  import { EyeOff } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    body: string
    concealed: boolean
    onReveal: () => void
  }
  let { body, concealed, onReveal }: Props = $props()
</script>

{#if concealed}
  <div class="relative rounded-md">
    <p
      class="pointer-events-none break-words whitespace-pre-wrap blur-sm select-none"
      aria-hidden="true"
      data-concealed="true"
      inert
    >
      {body}
    </p>
    <div class="absolute inset-0 flex items-center justify-center">
      <Button variant="secondary" size="sm" onclick={onReveal}>
        <EyeOff aria-hidden="true" />Show spoiler
      </Button>
    </div>
  </div>
{:else}
  <p class="break-words whitespace-pre-wrap">{body}</p>
{/if}
