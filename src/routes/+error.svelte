<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Oops · Tube</title>
</svelte:head>

<main class="page">
	<div class="empty">
		<h2>ERROR {page.status}</h2>
		<p class="muted">{page.status === 404 ? 'Nothing here.' : 'Something went wrong.'}</p>
		<p><a class="btn" href="/">Back to the channels</a></p>
	</div>
</main>
