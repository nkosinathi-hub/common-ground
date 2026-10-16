<script lang="ts">
  interface Props {
    message: string | null | undefined
    /** For aria-describedby on the field it explains. */
    id?: string
    /** Form-level errors are announced; field errors are described by their field. */
    alert?: boolean
  }

  let { message, id, alert = true }: Props = $props()
</script>

{#if message}
  <p {id} role={alert ? "alert" : undefined} class="text-sm text-destructive">{message}</p>
{/if}
