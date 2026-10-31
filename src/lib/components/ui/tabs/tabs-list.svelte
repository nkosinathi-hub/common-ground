<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const tabsListVariants = tv({
		base: "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
		variants: {
			variant: {
				// Local change: the Figma Tabs set. Pill: a muted track with the active tab on card fill.
				default: "h-10 rounded-lg bg-muted p-hairline pointer-coarse:h-11",
				// Underline: a bordered row; the active tab has a primary rule.
				line: "h-11 gap-5 border-b border-border bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		variant = "default",
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
/>
