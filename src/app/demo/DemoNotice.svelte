<script lang="ts">
  const exit = location.pathname + "#/auth/sign-in"
</script>

<!--
  The app's only bar above the shell. It is one line at every width and exactly --chrome-top
  tall (app.css), so every sticky bar below it (rail, top bar, phone app bar) sits at that offset.
-->
<div
  data-demo-notice
  class="sticky top-0 z-50 flex h-(--chrome-top) items-center justify-center gap-related overflow-hidden border-b bg-muted px-3 type-sm whitespace-nowrap"
>
  <strong>Sample demo</strong>
  <span class="hidden truncate sm:inline"
    >· The real app with sample data. Changes are not saved.</span
  >
  <a class="underline" href={exit}>Exit demo</a>
  <button type="button" class="underline" onclick={() => location.reload()}>Reset demo</button>
</div>
