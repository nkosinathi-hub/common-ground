<script lang="ts">
  import { cn } from "$lib/utils"

  interface Props {
    /** The Figma Logo sizes (216:7026). */
    size?: 24 | 32 | 40
    /** Accessible name; leave it out when a visible wordmark sits beside the mark. */
    label?: string
    class?: string
  }

  let { size = 32, label, class: className }: Props = $props()
</script>

<!-- The one logo: src/assets/logo.svg holds the same paths for the generated icons. -->
<svg
  width={size}
  height={size}
  viewBox="0 0 40 40"
  class={cn("shrink-0", className)}
  role={label ? "img" : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : "true"}
>
  <rect width="40" height="40" rx="9.0625" class="fill-brand" />
  <path
    class="fill-on-brand"
    d="M10.9384 18.6409V11.8438C10.9384 5.72653 20 5.72653 20 11.8438C20 5.72653 29.0616 5.72653 29.0616 11.8438V18.6409H25.6635V12.297C25.6635 9.57817 23.3981 9.57817 23.3981 12.297V18.6409H16.6019V12.297C16.6019 9.57817 14.3365 9.57817 14.3365 12.297V18.6409H10.9384Z"
  />
  <path
    class="fill-on-brand"
    d="M29.0616 20.8259V27.623C29.0616 33.7403 19.9986 33.7403 19.9986 27.623C19.9986 33.7403 10.9357 33.7403 10.9357 27.623V20.8259H14.3343L14.3343 27.1698C14.3343 29.8886 16.6 29.8886 16.6 27.1698V20.8259H23.3972V27.1698C23.3972 29.8886 25.663 29.8886 25.663 27.1698V20.8259H29.0616Z"
  />
</svg>
