<script lang="ts">
  let { message }: { message: string | undefined } = $props()
</script>

{#if message}<p class="text-sm text-destructive">{message}</p>{/if}
