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

	<section class="panel add">
		<h2 class="bar">$ add-channel</h2>
		<div class="body">
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
				<button class="btn go" disabled={busy}>{busy ? '…' : 'Add'}</button>
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
										<button class="btn small go" name="id" value={r.id} disabled={busy}>Add</button>
									</form>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted">No channels called that.</p>
				{/if}
			{/if}
		</div>
	</section>

	<section class="panel">
		<h2 class="bar">$ ls allowed/ <span>({data.channels.length})</span></h2>
		<div class="body">
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
		</div>
	</section>
</main>

<style>
	.page {
		max-width: 760px;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	h1 {
		flex: 1;
		font-size: 48px;
	}
	.panel h2 {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--muted);
		text-shadow: none;
	}
	.body > p:first-child {
		margin-top: 0;
	}
	.add form {
		display: flex;
		gap: 10px;
		margin-top: 12px;
	}
	.add .error,
	.added {
		margin: 14px 0 0;
	}
	.added {
		color: var(--green);
	}
	.added::before {
		content: '✓ ';
	}
	.results,
	.list {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
	}
	.list {
		margin: 0;
	}
	.results li,
	.list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0;
		border-top: 1px dashed var(--green-dim);
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
		font-size: 13px;
	}
	.who strong {
		font-size: 15px;
		color: var(--text);
	}
	.who a {
		text-decoration: none;
	}
</style>
