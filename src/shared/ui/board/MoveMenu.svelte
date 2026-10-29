<script lang="ts">
  import { Ellipsis } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"

  interface Props {
    /** Names the card, e.g. "Compare two campsites". */
    subject: string
    columns: readonly { readonly id: string; readonly title: string }[]
    current: string
    /** "Move to stage" on ideas, "Move to status" on tasks. */
    heading: string
    onmove: (column: string) => void
    /** More items for the card, e.g. Rename and Delete. */
    children?: Snippet
  }

  let { subject, columns, current, heading, onmove, children }: Props = $props()
</script>

<!-- The keyboard and screen-reader way to move a card, beside dragging it. -->
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon-sm" aria-label="Actions for {subject}">
        <Ellipsis />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Group>
      <DropdownMenu.GroupHeading>{heading}</DropdownMenu.GroupHeading>
      {#each columns.filter((column) => column.id !== current) as column (column.id)}
        <DropdownMenu.Item onSelect={() => onmove(column.id)}>{column.title}</DropdownMenu.Item>
      {/each}
    </DropdownMenu.Group>
    {#if children}<DropdownMenu.Separator />{@render children()}{/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
