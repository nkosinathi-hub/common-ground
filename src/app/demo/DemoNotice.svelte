<script lang="ts">
  const exit = location.pathname + "#/auth/sign-in"
</script>

<!-- Sticky, and it sets --chrome-top so the shell's rail sits below it. -->
<div
  data-demo-notice
  class="z-50 border-b bg-muted px-3 py-2 text-center text-sm md:sticky md:top-0 md:h-9"
>
  <strong>Sample demo</strong> · The real app with sample data. Changes are not saved.
  <a class="ml-2 underline" href={exit}>Exit demo</a>
  <button type="button" class="ml-2 underline" onclick={() => location.reload()}>Reset demo</button>
</div>
