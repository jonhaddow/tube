<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Oops · Tube</title>
</svelte:head>

<main class="page">
	<div class="empty card">
		<h2>{page.status === 404 ? 'Nothing here' : 'Something went wrong'}</h2>
		<p><a class="btn sun" href="/">Back to the channels</a></p>
	</div>
</main>
