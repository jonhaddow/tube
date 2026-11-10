<script lang="ts">
	import { goto } from '$app/navigation';
	import Avatar from '#lib/components/Avatar.svelte';
	import BackIcon from '#lib/components/BackIcon.svelte';
	import Player from '#lib/components/Player.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const channelUrl = $derived(`/c/${data.video.channelId}`);
</script>

<svelte:head>
	<title>{data.video.title} · Tube</title>
</svelte:head>

<main class="page">
	<header>
		<a class="back" href={channelUrl} aria-label="Back to {data.video.channelTitle}"><BackIcon /></a
		>
		<Avatar src={data.video.avatar} title={data.video.channelTitle} size={52} />
		<h1>{data.video.title}</h1>
	</header>

	{#key data.video.id}
		<!-- No autoplay of the next one: when it ends, back to the channel. -->
		<Player
			id={data.video.id}
			title={data.video.title}
			onended={() => goto(channelUrl, { replaceState: true })}
		/>
	{/key}
</main>

<style>
	.page {
		max-width: 1100px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 0 0 20px;
	}
	h1 {
		font-family: var(--body);
		font-weight: 700;
		font-size: 22px;
		line-height: 1.2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
