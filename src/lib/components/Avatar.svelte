<script lang="ts">
	// A channel's picture in a ring; its first letter on a colour if it has none.
	let { src, title, size = 120 }: { src: string | null; title: string; size?: number } = $props();
	const COLOURS = ['#ffd23f', '#ff5d3a', '#8be37a', '#c59bff', '#ff9ed2'];
	const colour = $derived(
		COLOURS[[...title].reduce((n, c) => n + c.charCodeAt(0), 0) % COLOURS.length]
	);
</script>

<span class="avatar" style:width="{size}px" style:height="{size}px" style:background={colour}>
	{#if src}
		<img {src} alt="" referrerpolicy="no-referrer" loading="lazy" />
	{:else}
		<span style:font-size="{size * 0.45}px">{title.slice(0, 1).toUpperCase()}</span>
	{/if}
</span>

<style>
	.avatar {
		display: grid;
		place-items: center;
		flex: none;
		border: var(--line);
		border-radius: 50%;
		box-shadow: var(--lift-small);
		overflow: hidden;
		font-family: var(--display);
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
