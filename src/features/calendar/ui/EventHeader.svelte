<script lang="ts">
  import { CalendarDays, ChevronLeft, Download, Ellipsis, SquarePen, Trash2 } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { buildHash } from "@/shared/domain"
  import { ConfirmDialog, TextLink } from "@/shared/ui"
  import { eventIcs, formatWhen, icsFileName, utcOffset, type CalendarEvent } from "../domain"
  import { saveFile } from "./browser"

  interface Props {
    event: CalendarEvent
    spaceId: string
    zone: string
    /** The creator or the owner: they may edit and delete. */
    mayChange: boolean
    onEdit: () => void
    onDelete: () => Promise<void>
  }

  let { event, spaceId, zone, mayChange, onEdit, onDelete }: Props = $props()
  const when = $derived(formatWhen(event.timing, event.timeZone, zone))
  let confirming = $state(false)
  const download = () =>
    saveFile(icsFileName(event.title), eventIcs(event, new Date()), "text/calendar")
</script>

<!-- D14 header: back, the title, when in your zone, then Edit, the .ics and the rest in a menu. -->
<header class="flex flex-col gap-stack">
  <TextLink
    href={buildHash({ name: "calendar", spaceId })}
    icon={ChevronLeft}
    class="w-fit flex-row-reverse">Calendar</TextLink
  >
  <div class="flex flex-wrap items-start justify-between gap-stack">
    <div class="flex min-w-0 flex-col gap-related">
      <h1 class="type-h1 text-foreground">{event.title}</h1>
      <p class="flex flex-wrap items-center gap-related type-body text-muted-foreground">
        <CalendarDays class="size-4 shrink-0" aria-hidden="true" />
        <span data-testid="event-when">{when.text}</span>
        <Badge variant="outline">{zone} · {utcOffset(zone, Date.now())}</Badge>
      </p>
    </div>
    <div class="flex items-center gap-related">
      {#if mayChange}
        <Button variant="outline" onclick={onEdit}><SquarePen aria-hidden="true" />Edit</Button>
      {/if}
      <Button variant="outline" size="icon" aria-label="Download .ics" onclick={download}>
        <Download aria-hidden="true" />
      </Button>
      {#if mayChange}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="ghost" size="icon" aria-label="More for {event.title}">
                <Ellipsis aria-hidden="true" />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item variant="destructive" onSelect={() => (confirming = true)}>
              <Trash2 aria-hidden="true" />Delete event
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>
  </div>
</header>
<ConfirmDialog
  bind:open={confirming}
  title="Delete this event?"
  description="Everyone invited loses it from their calendar. This cannot be undone."
  confirmLabel="Delete"
  onConfirm={onDelete}
/>
