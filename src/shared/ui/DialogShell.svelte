<script lang="ts">
  import type { Snippet } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { cn } from "$lib/utils"
  import DialogShellHeader from "./DialogShellHeader.svelte"
  import { focusFirstField } from "./focus"

  interface Props {
    open: boolean
    title: string
    description?: string
    /** 720 instead of 560, for side-by-side fields. */
    wide?: boolean
    /** Under the title, e.g. the dialog's tabs. */
    header?: Snippet
    children: Snippet
    /** The one primary action; Cancel always sits before it. Submits the form. */
    primary?: string
    destructive?: boolean
    busy?: boolean
    disabled?: boolean
    onsubmit?: () => unknown
    /** Replaces the footer, for a step indicator or a status line. */
    footer?: Snippet
    /** Sits at the footer's start, before Cancel, e.g. "Delete event…". */
    footerStart?: Snippet
    cancelLabel?: string
  }

  let {
    open = $bindable(false),
    title,
    description,
    wide = false,
    header,
    children,
    primary,
    destructive = false,
    busy = false,
    disabled = false,
    onsubmit,
    footer,
    footerStart,
    cancelLabel = "Cancel",
  }: Props = $props()

  // Opens on the first field, so typing starts at once; Close is only the fallback.
  let body = $state<HTMLElement>()

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (!busy && !disabled) void onsubmit?.()
  }
</script>

<!-- Figma dialogs (162:2026): header, a 24 px body, a bordered footer; a sheet below 640 px. -->
<Dialog.Root bind:open>
  <Dialog.Content
    showCloseButton={false}
    onOpenAutoFocus={(event) => focusFirstField(body, event)}
    class={cn(
      "flex max-h-[min(90dvh,56rem)] w-full flex-col gap-0 overflow-hidden rounded-xl border-border bg-card p-0",
      wide ? "sm:max-w-dialog-wide" : "sm:max-w-dialog",
      "max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none",
    )}
  >
    <DialogShellHeader {title} {description} {header} />
    <form class="flex min-h-0 flex-1 flex-col" onsubmit={submit}>
      <div bind:this={body} class="flex min-h-0 flex-1 flex-col gap-card overflow-y-auto p-6">
        {@render children()}
      </div>
      <div
        class="flex items-center justify-end gap-related border-t border-border px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {#if footer}{@render footer()}{:else}
          {#if footerStart}<div class="mr-auto">{@render footerStart()}</div>{/if}
          <Button variant="outline" onclick={() => (open = false)}>{cancelLabel}</Button>
          {#if primary}
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={busy || disabled}
            >
              {primary}
            </Button>
          {/if}
        {/if}
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
