<script lang="ts">
  import type { Snippet } from "svelte"
  import * as Card from "$lib/components/ui/card"

  let {
    title,
    description,
    children,
    footer,
  }: {
    title: string
    description?: string
    children: Snippet
    footer?: Snippet
  } = $props()
</script>

<main class="flex min-h-dvh items-center justify-center bg-banner/40 px-4 py-10">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <p class="font-serif text-sm tracking-wide text-primary">Common Ground</p>
      <Card.Title level={1} class="text-2xl">{title}</Card.Title>
      {#if description}<Card.Description>{description}</Card.Description>{/if}
    </Card.Header>
    <Card.Content>{@render children()}</Card.Content>
    {#if footer}<Card.Footer class="flex-col gap-2 text-sm text-muted-foreground"
        >{@render footer()}</Card.Footer
      >{/if}
  </Card.Root>
</main>
