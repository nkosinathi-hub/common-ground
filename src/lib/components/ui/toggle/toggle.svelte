<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const toggleVariants = tv({
		base: "hover:text-foreground aria-pressed:bg-muted focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive data-[state=on]:bg-muted gap-related rounded-md type-label transition-all [&_svg:not([class*='size-'])]:size-4 group/toggle inline-flex items-center justify-center whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "border-border hover:bg-muted border bg-transparent",
				// Local change: one segment of the Figma Segmented control; the group draws the track.
				segment: "flex-1 rounded-sm px-3 text-muted-foreground hover:bg-transparent data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs",
			},
			size: {
				default: "h-8 min-w-8 px-2.5 pointer-coarse:h-9",
				sm: "h-7 min-w-7 px-2 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-control-default min-w-10 px-3",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ToggleVariant = VariantProps<typeof toggleVariants>["variant"];
	export type ToggleSize = VariantProps<typeof toggleVariants>["size"];
	export type ToggleVariants = VariantProps<typeof toggleVariants>;
</script>

<script lang="ts">
	import { Toggle as TogglePrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = "default",
		variant = "default",
		...restProps
	}: TogglePrimitive.RootProps & {
		variant?: ToggleVariant;
		size?: ToggleSize;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	data-slot="toggle"
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
