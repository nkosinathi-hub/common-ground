<script lang="ts">
  import { Button } from "$lib/components/ui/button"

  interface Props {
    title: string
    description: string
    action: string
    /** The last, irreversible step is solid red; the others are outlined. */
    solid?: boolean
    onclick: () => void
  }

  let { title, description, action, solid = false, onclick }: Props = $props()
</script>

<!-- D17 danger row: what happens, then the action that starts it. -->
<div class="flex flex-wrap items-center justify-between gap-item">
  <div class="flex min-w-0 flex-1 flex-col gap-hairline">
    <p class="type-label text-foreground">{title}</p>
    <p class="type-sm text-muted-foreground">{description}</p>
  </div>
  <Button
    variant={solid ? "destructive" : "outline"}
    class={solid ? undefined : "text-destructive"}
    {onclick}>{action}</Button
  >
</div>
