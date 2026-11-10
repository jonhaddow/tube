<script lang="ts">
	// A channel's picture in a green frame; its first letter if it has none.
	let { src, title, size = 120 }: { src: string | null; title: string; size?: number } = $props();
</script>

<span class="avatar" style:width="{size}px" style:height="{size}px">
	{#if src}
		<img {src} alt="" referrerpolicy="no-referrer" loading="lazy" />
	{:else}
		<span style:font-size="{size * 0.6}px">{title.slice(0, 1).toUpperCase()}</span>
	{/if}
</span>

<style>
	.avatar {
		display: grid;
		place-items: center;
		flex: none;
		background: var(--panel);
		border: 1px solid var(--green-dim);
		border-radius: 2px;
		overflow: hidden;
		font-family: var(--display);
		color: var(--green);
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
