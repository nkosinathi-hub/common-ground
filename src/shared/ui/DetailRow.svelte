<script lang="ts">
  import type { Component, Snippet } from "svelte"

  interface Props {
    label: string
    /** The value; or pass `children` for a link, badge or control. */
    value?: string
    /** With an icon the value leads and the label sits under it (Detail row / With icon). */
    icon?: Component
    children?: Snippet
  }

  let { label, value, icon: Icon, children }: Props = $props()
</script>

{#if Icon}
  <div class="flex items-start gap-item border-b border-border py-inset last:border-b-0">
    <Icon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <dl class="flex min-w-0 flex-1 flex-col-reverse gap-0.5">
      <dt class="type-sm text-muted-foreground">{label}</dt>
      <dd class="type-label text-foreground">
        {#if children}{@render children()}{:else}{value}{/if}
      </dd>
    </dl>
  </div>
{:else}
  <dl class="flex items-center gap-item border-b border-border py-item last:border-b-0">
    <dt class="min-w-0 flex-1 type-sm text-muted-foreground">{label}</dt>
    <dd class="min-w-0 text-right type-label text-foreground">
      {#if children}{@render children()}{:else}{value}{/if}
    </dd>
  </dl>
{/if}
