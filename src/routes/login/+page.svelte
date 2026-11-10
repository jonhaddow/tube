<script lang="ts">
	import Wordmark from '#lib/components/Wordmark.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Grown-ups · Tube</title>
</svelte:head>

<main class="page login">
	<Wordmark size={84} />
	<h1>Grown-ups only</h1>
	<p>Sign in to choose which channels the kids can watch.</p>

	{#if data.error}<p class="error" role="alert">{data.error}</p>{/if}

	<p class="actions">
		<a class="btn sun" href="/auth/google?next={encodeURIComponent(data.next)}">
			<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M21.35 11.1H12v2.98h5.35c-.23 1.45-1.66 4.25-5.35 4.25-3.22 0-5.85-2.67-5.85-5.96S8.78 6.41 12 6.41c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.69 3.85 14.55 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.06-.15-1.51z"
				/>
			</svg>
			Sign in with Google
		</a>
		<a class="btn" href="/">Back to videos</a>
	</p>

	{#if data.devUsers.length}
		<form method="POST" action="?/dev" class="dev">
			<input type="hidden" name="next" value={data.next} />
			<p class="muted">Development only</p>
			{#each data.devUsers as u (u.email)}
				<button class="btn small" name="email" value={u.email}>Sign in as {u.name}</button>
			{/each}
		</form>
	{/if}
</main>

<style>
	.login {
		max-width: 620px;
		margin: 0;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-start;
		gap: 18px;
		padding-bottom: max(56px, env(safe-area-inset-bottom));
	}
	h1 {
		margin-top: 28px;
		font-size: clamp(44px, 9vw, 72px);
		color: var(--paper);
		-webkit-text-stroke: 3px var(--ink);
		paint-order: stroke fill;
		text-shadow: 5px 5px 0 var(--ink);
	}
	p {
		margin: 0;
		font-size: 19px;
		max-width: 30ch;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 8px;
		max-width: none;
	}
	.dev {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.dev p {
		font-size: 13px;
	}
</style>
