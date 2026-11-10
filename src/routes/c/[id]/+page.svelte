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
		<h1>{data.channel.title}</h1>
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
					class="btn sun"
					href="?n={data.n + data.page}"
					data-sveltekit-reset="false"
					data-sveltekit-replacestate>More videos</a
				>
			</p>
		{/if}
	{:else}
		<div class="empty card">
			<h2>No videos yet</h2>
			<p>They’re on their way. Try again in a bit.</p>
		</div>
	{/if}
</main>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 4px 0 30px;
	}
	h1 {
		font-size: clamp(30px, 5vw, 46px);
		color: var(--paper);
		-webkit-text-stroke: 2px var(--ink);
		paint-order: stroke fill;
		text-shadow: 3px 3px 0 var(--ink);
		overflow-wrap: anywhere;
	}
	.videos {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 26px 22px;
	}
	.videos a {
		display: flex;
		flex-direction: column;
		height: 100%;
		text-decoration: none;
		background: var(--paper);
		border: var(--line);
		border-radius: var(--corner);
		box-shadow: var(--lift);
		overflow: hidden;
		transition:
			transform 80ms,
			box-shadow 80ms;
	}
	.videos a:active {
		transform: translate(4px, 4px);
		box-shadow: 1px 1px 0 var(--ink);
	}
	.thumb {
		position: relative;
		display: block;
		aspect-ratio: 16 / 9;
		background: var(--sky-deep);
		border-bottom: var(--line);
	}
	/* hqdefault is 4:3 with bars; cover crops them off. */
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.length {
		position: absolute;
		right: 8px;
		bottom: 8px;
		padding: 2px 8px;
		font-size: 14px;
		font-weight: 700;
		background: var(--sun);
		border: 2px solid var(--ink);
		border-radius: 8px;
	}
	.title {
		padding: 10px 12px 12px;
		font-weight: 600;
	}
	.title span {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.more {
		margin: 36px 0 0;
		text-align: center;
	}
</style>
