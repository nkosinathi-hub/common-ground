<script lang="ts">
  import { cn } from "$lib/utils"

  interface Props {
    message: string | null | undefined
    /** For aria-describedby on the field it explains. */
    id?: string
    /** Form-level errors are announced; field errors are described by their field. */
    alert?: boolean
    /** Layout or size classes; they win over the default text-sm. */
    class?: string
  }

  let { message, id, alert = true, class: className = "" }: Props = $props()
</script>

{#if message}
  <p {id} role={alert ? "alert" : undefined} class={cn("text-sm text-destructive", className)}>
    {message}
  </p>
{/if}
