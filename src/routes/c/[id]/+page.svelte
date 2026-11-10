<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import BackIcon from '#lib/components/BackIcon.svelte';
	import { clock } from '#lib/time.ts';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.channel.title} · Tube</title>
</svelte:head>

<main class="page">
	<header>
		<a class="back" href="/" aria-label="All channels"><BackIcon /></a>
		<Avatar src={data.channel.avatar} title={data.channel.title} size={64} />
		<h1><span class="path">&gt; </span>{data.channel.title}</h1>
	</header>

	{#if data.videos.length}
		<ul class="videos">
			{#each data.videos as v (v.id)}
				<li>
					<a href="/v/{v.id}">
						<span class="thumb">
							<img
								src="https://i.ytimg.com/vi/{v.id}/hqdefault.jpg"
								alt=""
								loading="lazy"
								referrerpolicy="no-referrer"
							/>
							<span class="length">{clock(v.seconds)}</span>
						</span>
						<span class="title"><span>{v.title}</span></span>
					</a>
				</li>
			{/each}
		</ul>
		{#if data.more}
			<p class="more">
				<a
					class="btn"
					href="?n={data.next}"
					data-sveltekit-reset="false"
					data-sveltekit-replacestate>More videos</a
				>
			</p>
		{/if}
	{:else}
		<div class="empty">
			<h2>No videos yet</h2>
			<p class="muted">Downloading the list… try again in a bit.</p>
		</div>
	{/if}
</main>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 4px 0 28px;
	}
	h1 {
		font-size: clamp(36px, 6vw, 56px);
		overflow-wrap: anywhere;
	}
	.path {
		margin-right: 0.3em;
		color: var(--green-dim);
	}
	.videos {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 22px 18px;
	}
	.videos a {
		display: flex;
		flex-direction: column;
		height: 100%;
		text-decoration: none;
		background: var(--panel);
		border: var(--line);
		border-radius: 2px;
		overflow: hidden;
	}
	.videos a:active,
	.videos a:hover {
		border-color: var(--green);
		box-shadow: var(--glow);
	}
	.thumb {
		position: relative;
		display: block;
		aspect-ratio: 16 / 9;
		background: #000;
		overflow: hidden;
	}
	/* hqdefault is 4:3 with black bars above and below: centred in 16:9, they're cut off. */
	.thumb img {
		position: absolute;
		top: 50%;
		width: 100%;
		aspect-ratio: 4 / 3;
		transform: translateY(-50%);
	}
	.length {
		position: absolute;
		right: 6px;
		bottom: 6px;
		padding: 1px 6px;
		font-size: 13px;
		font-weight: 700;
		color: var(--amber);
		background: rgb(0 0 0 / 0.8);
		border-radius: 2px;
	}
	.title {
		padding: 10px 12px 12px;
		font-size: 14px;
		font-weight: 500;
	}
	.title span {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.more {
		margin: 32px 0 0;
		text-align: center;
	}
</style>
