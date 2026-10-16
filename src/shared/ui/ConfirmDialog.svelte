<script lang="ts">
  import type { Snippet } from "svelte"
  import * as AlertDialog from "$lib/components/ui/alert-dialog"

  interface Props {
    open?: boolean
    title: string
    description: string
    confirmLabel: string
    destructive?: boolean
    onConfirm: () => unknown
    children?: Snippet
  }

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel,
    destructive = true,
    onConfirm,
    children,
  }: Props = $props()
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{description}</AlertDialog.Description>
    </AlertDialog.Header>
    {@render children?.()}
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        class={destructive ? "bg-destructive text-white hover:bg-destructive/90" : ""}
        onclick={onConfirm}>{confirmLabel}</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
