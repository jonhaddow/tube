<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Tube</title>
</svelte:head>

<main class="page">
	<header>
		<h1><Wordmark size={52} /></h1>
	</header>

	{#if data.channels.length}
		<ul class="channels">
			{#each data.channels as c (c.id)}
				<li>
					<a href="/c/{c.id}">
						<Avatar src={c.avatar} title={c.title} size={132} />
						<span class="name">{c.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty card">
			<h2>No channels yet</h2>
			<p>Ask a grown-up to pick some.</p>
		</div>
	{/if}

	<footer><a href="/parent">Grown-ups</a></footer>
</main>

<style>
	header {
		margin: 8px 0 36px;
	}
	.channels {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: 36px 20px;
	}
	.channels a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		text-decoration: none;
		transition: transform 100ms;
	}
	.channels a:active {
		transform: scale(0.95);
	}
	.name {
		max-width: 100%;
		padding: 5px 12px;
		font-weight: 700;
		text-align: center;
		background: var(--paper);
		border: var(--line);
		border-radius: 10px;
		box-shadow: var(--lift-small);
		overflow-wrap: anywhere;
	}
	footer {
		margin-top: 64px;
		text-align: center;
		font-size: 14px;
	}
	footer a {
		color: rgb(20 22 26 / 0.55);
	}
</style>
