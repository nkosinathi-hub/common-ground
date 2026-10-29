<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

	export const buttonVariants = tv({
		// Local change: variants and sizes follow the Figma Button set (175:23); sizes come from the
		// control tokens, the label is label/default, corners are radius/md.
		base: "focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive rounded-md border border-transparent bg-clip-padding type-label focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center gap-related whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				// Hover mixes toward the foreground, so the label keeps its contrast in every space look.
				default: "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary),var(--foreground)_12%)]",
				outline: "border-border bg-card text-primary hover:bg-muted aria-expanded:bg-muted",
				secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary",
				ghost: "text-primary hover:bg-muted aria-expanded:bg-muted",
				destructive: "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklab,var(--destructive),var(--foreground)_12%)] focus-visible:ring-destructive/20 focus-visible:border-destructive",
				link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-control-default px-control-padding-default",
				sm: "h-control-inline px-control-padding-sm",
				lg: "h-control-touch px-control-padding-lg",
				icon: "size-control-default",
				"icon-sm": "size-control-inline",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
