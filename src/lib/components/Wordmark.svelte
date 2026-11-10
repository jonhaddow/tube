<script lang="ts">
	// "tube" on a sun-yellow TV sticker.
	let { size = 44 }: { size?: number } = $props();
</script>

<span class="mark" style:font-size="{size}px" aria-label="Tube">
	<span aria-hidden="true">tube</span>
</span>

<style>
	.mark {
		display: inline-block;
		padding: 0.08em 0.32em 0.16em;
		font-family: var(--display);
		line-height: 1;
		background: var(--sun);
		border: var(--line);
		border-radius: 0.3em;
		box-shadow: var(--lift);
		transform: rotate(-3deg);
	}
</style>
