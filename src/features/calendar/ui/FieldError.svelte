<script lang="ts">
  interface Props {
    message: string | undefined
  }

  let { message }: Props = $props()
</script>

{#if message}<p class="text-sm text-destructive">{message}</p>{/if}
