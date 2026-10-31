<script lang="ts">
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		loadingStatus = $bindable("loading"),
		size = "default",
		tone = "secondary",
		class: className,
		...restProps
	}: AvatarPrimitive.RootProps & {
		size?: "default" | "sm" | "lg";
		/** Local change: the Figma Avatar tones; brand is lime with on-brand initials. */
		tone?: "secondary" | "brand";
	} = $props();
</script>

<AvatarPrimitive.Root
	bind:ref
	bind:loadingStatus
	data-slot="avatar"
	data-size={size}
	data-tone={tone}
	class={cn(
		"size-8 rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6 group/avatar relative flex shrink-0 select-none",
		className
	)}
	{...restProps}
/>
