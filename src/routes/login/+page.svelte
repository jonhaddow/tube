<script lang="ts">
	import Wordmark from '#lib/components/Wordmark.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Grown-ups · Tube</title>
</svelte:head>

<main class="page login">
	<Wordmark size={72} />
	<pre class="log" aria-hidden="true">connecting to /parent…
<span class="deny">ACCESS DENIED</span>: grown-ups only</pre>
	<h1 class="visually-hidden">Grown-ups only</h1>
	<p>Sign in to choose which channels the kids can watch.</p>

	{#if data.error}<p class="error" role="alert">{data.error}</p>{/if}

	<p class="actions">
		<a class="btn go" href="/auth/google?next={encodeURIComponent(data.next)}">
			<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M21.35 11.1H12v2.98h5.35c-.23 1.45-1.66 4.25-5.35 4.25-3.22 0-5.85-2.67-5.85-5.96S8.78 6.41 12 6.41c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.69 3.85 14.55 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.06-.15-1.51z"
				/>
			</svg>
			Sign in with Google
		</a>
		<a class="btn" href="/">Back</a>
	</p>

	{#if data.devUsers.length}
		<form method="POST" action="?/dev" class="dev">
			<input type="hidden" name="next" value={data.next} />
			<p class="muted">dev only:</p>
			{#each data.devUsers as u (u.email)}
				<button class="btn small" name="email" value={u.email}>Sign in as {u.name}</button>
			{/each}
		</form>
	{/if}
</main>

<style>
	.login {
		max-width: 640px;
		margin: 0;
		padding-top: max(48px, env(safe-area-inset-top));
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}
	.log {
		margin: 12px 0 0;
		font: 15px/1.6 var(--mono);
		color: var(--muted);
		white-space: pre-wrap;
	}
	.deny {
		color: var(--red);
		font-weight: 700;
	}
	p {
		margin: 0;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 8px;
	}
	.dev {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-top: 24px;
	}
	.dev p {
		font-size: 13px;
	}
</style>
