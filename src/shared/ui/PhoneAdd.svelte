<script lang="ts">
  import type { Snippet } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import { Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    /** The trigger's words on phones, e.g. "Add note". */
    label: string
    /** Inside a card the trigger is a quiet row; standing alone it is a full-width outline. */
    variant?: "row" | "block"
    children: Snippet
  }

  let { label, variant = "row", children }: Props = $props()
  const wide = new MediaQuery("min-width: 768px")
  let open = $state(false)
</script>

<!-- Desktop shows the add form in place; phones keep the height for the content and open it on
     request, as M04's "Add item". -->
{#if wide.current || open}
  {@render children()}
{:else}
  <Button
    variant={variant === "row" ? "ghost" : "outline"}
    class={variant === "row" ? "self-start px-0 has-[>svg]:px-0" : "w-full"}
    onclick={() => (open = true)}
  >
    <Plus aria-hidden="true" />{label}
  </Button>
{/if}
