<script lang="ts">
	// `> tube_` with a blinking cursor.
	let { size = 56 }: { size?: number } = $props();
</script>

<span class="mark" style:font-size="{size}px" aria-label="Tube">
	<span aria-hidden="true"><span class="prompt">&gt;</span> tube<span class="cursor"></span></span>
</span>

<style>
	.mark {
		font-family: var(--display);
		line-height: 1;
		color: var(--green);
		text-shadow: var(--glow);
	}
	.prompt {
		color: var(--green-dim);
	}
</style>
