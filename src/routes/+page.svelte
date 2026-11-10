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
		<h1><Wordmark size={64} /></h1>
		<p class="muted">
			// {data.channels.length} channel{data.channels.length === 1 ? '' : 's'} online
		</p>
	</header>

	{#if data.channels.length}
		<ul class="channels">
			{#each data.channels as c (c.id)}
				<li>
					<a href="/c/{c.id}">
						<Avatar src={c.avatar} title={c.title} size={150} />
						<span class="name">{c.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty">
			<h2>No channels yet</h2>
			<p class="muted">Ask a grown-up to add some.</p>
		</div>
	{/if}

	<footer><a href="/parent">grown-ups</a></footer>
</main>

<style>
	header {
		margin: 4px 0 32px;
	}
	header p {
		margin: 6px 0 0;
	}
	.channels {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: 28px 20px;
	}
	.channels a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 10px;
		text-decoration: none;
		border: 1px solid transparent;
		border-radius: 2px;
	}
	.channels a:active,
	.channels a:hover {
		border-color: var(--green);
		box-shadow: var(--glow);
	}
	.name {
		max-width: 100%;
		font-size: 14px;
		font-weight: 600;
		text-align: center;
		overflow-wrap: anywhere;
	}
	footer {
		margin-top: 64px;
		text-align: center;
		font-size: 13px;
	}
	footer a {
		color: var(--muted);
	}
</style>
