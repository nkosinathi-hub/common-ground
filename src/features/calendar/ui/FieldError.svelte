<script lang="ts">
  interface Props {
    message: string | undefined
  }

  let { message }: Props = $props()
</script>

{#if message}<p class="type-sm text-destructive">{message}</p>{/if}
