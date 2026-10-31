<script lang="ts">
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AvatarPrimitive.FallbackProps = $props();
</script>

<AvatarPrimitive.Fallback
	bind:ref
	data-slot="avatar-fallback"
	class={cn(
		"bg-secondary text-secondary-foreground rounded-full flex size-full items-center justify-center type-label group-data-[size=sm]/avatar:type-label-sm group-data-[tone=brand]/avatar:bg-brand group-data-[tone=brand]/avatar:text-on-brand",
		className
	)}
	{...restProps}
/>
