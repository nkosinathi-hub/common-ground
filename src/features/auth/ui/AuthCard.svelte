<script lang="ts">
  import type { Snippet } from "svelte"
  import * as Card from "$lib/components/ui/card"

  let { title, description, children, footer }: {
    title: string
    description?: string
    children: Snippet
    footer?: Snippet
  } = $props()
</script>

<main class="bg-banner/40 flex min-h-dvh items-center justify-center px-4 py-10">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <p class="text-primary font-serif text-sm tracking-wide">Common Ground</p>
      <Card.Title class="text-2xl">{title}</Card.Title>
      {#if description}<Card.Description>{description}</Card.Description>{/if}
    </Card.Header>
    <Card.Content>{@render children()}</Card.Content>
    {#if footer}<Card.Footer class="text-muted-foreground flex-col gap-2 text-sm">{@render footer()}</Card.Footer>{/if}
  </Card.Root>
</main>
