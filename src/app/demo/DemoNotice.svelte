<script lang="ts">
  const exit = location.pathname + "#/auth/sign-in"
</script>

<div class="border-b bg-muted px-3 py-2 text-center text-sm">
  <strong>Sample demo</strong> · The real app with sample data. Changes are not saved.
  <a class="ml-2 underline" href={exit}>Exit demo</a>
  <button type="button" class="ml-2 underline" onclick={() => location.reload()}>Reset demo</button>
</div>
