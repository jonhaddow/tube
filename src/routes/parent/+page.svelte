<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import BackIcon from '#lib/components/BackIcon.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let busy = $state(false);

	const submitting = () => {
		busy = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update();
			busy = false;
		};
	};
</script>

<svelte:head>
	<title>Grown-ups · Tube</title>
</svelte:head>

<main class="page">
	<header>
		<a class="back" href="/" aria-label="Back to the kids’ page"><BackIcon /></a>
		<h1>Channels</h1>
		<form method="POST" action="/logout" class="signout">
			<button class="btn small">Sign out</button>
		</form>
	</header>

	<section class="card add">
		<h2>Add a channel</h2>
		<p class="muted">Paste a channel link or @handle from YouTube, or type a name to search.</p>
		<form method="POST" action="?/add" use:enhance={submitting}>
			<label class="visually-hidden" for="q">Channel</label>
			<input
				id="q"
				class="field"
				name="q"
				value={form?.q ?? ''}
				placeholder="@channel or a name"
				autocomplete="off"
				autocapitalize="off"
				required
			/>
			<button class="btn sun" disabled={busy}>{busy ? 'Looking…' : 'Add'}</button>
		</form>

		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		{#if form && 'added' in form}<p class="added" role="status">Added {form.added}.</p>{/if}

		{#if form && 'results' in form && form.results}
			{#if form.results.length}
				<ul class="results">
					{#each form.results as r (r.id)}
						<li>
							<Avatar src={r.avatar} title={r.title} size={48} />
							<span class="who">
								<strong>{r.title}</strong>
								{#if r.handle}<span class="muted">{r.handle}</span>{/if}
							</span>
							{#if r.known}
								<span class="muted">Added</span>
							{:else}
								<form method="POST" action="?/pick" use:enhance={submitting}>
									<button class="btn small sun" name="id" value={r.id} disabled={busy}>Add</button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted">No channels called that.</p>
			{/if}
		{/if}
	</section>

	<section class="card">
		<h2>Allowed ({data.channels.length})</h2>
		{#if data.channels.length}
			<ul class="list">
				{#each data.channels as c (c.id)}
					<li>
						<Avatar src={c.avatar} title={c.title} size={48} />
						<span class="who">
							<a href="/c/{c.id}"><strong>{c.title}</strong></a>
							<span class="muted">
								{c.videos} videos{c.fetchingOlder ? ', fetching older ones…' : ''}
							</span>
						</span>
						<form
							method="POST"
							action="?/remove"
							use:enhance={({ cancel }) => {
								if (!confirm(`Remove ${c.title}?`)) cancel();
							}}
						>
							<button class="btn small danger" name="id" value={c.id}>Remove</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">None yet: the kids see only the channels added here.</p>
		{/if}
	</section>
</main>

<style>
	.page {
		max-width: 720px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	h1 {
		flex: 1;
		font-size: 40px;
	}
	h2 {
		font-size: 26px;
		margin-bottom: 8px;
	}
	.add form {
		display: flex;
		gap: 10px;
		margin-top: 14px;
	}
	.add .error,
	.added {
		margin: 14px 0 0;
	}
	.added {
		font-weight: 700;
	}
	.results,
	.list {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
	}
	.results li,
	.list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0;
		border-top: 2px dashed rgb(20 22 26 / 0.2);
	}
	.results li:first-child,
	.list li:first-child {
		border-top: 0;
	}
	.results form {
		margin: 0;
	}
	.who {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		font-size: 15px;
	}
	.who strong {
		font-size: 17px;
	}
	.who a {
		text-decoration: none;
	}
</style>
