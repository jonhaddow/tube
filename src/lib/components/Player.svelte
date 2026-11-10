<script lang="ts">
	import { page } from '$app/state';
	import { positionOf, savePosition } from '#lib/positions.ts';

	// YouTube's no-cookie player with its own controls, so its full screen button
	// is the device's own (the iPhone's video player). We listen to it through the
	// embed's postMessage API to keep the place and go back when it ends.
	let { id, title, onended }: { id: string; title: string; onended: () => void } = $props();

	const YOUTUBE = 'https://www.youtube-nocookie.com';
	const PARAMS = 'autoplay=1&iv_load_policy=3&playsinline=1&rel=0&enablejsapi=1';

	let playing = $state(false);
	let started = false;
	let time = 0;
	let duration = 0;

	const src = $derived(
		`${YOUTUBE}/embed/${id}?${PARAMS}&origin=${encodeURIComponent(page.url.origin)}`
	);

	// Keep the screen on while it plays: iOS doesn't count a video in an iframe and
	// dims, then locks. The lock is dropped when the page is hidden, so it's asked
	// for again on coming back.
	$effect(() => {
		if (!playing || !('wakeLock' in navigator)) return;
		// Refused (low battery mode): the screen just dims as before.
		let lock: Promise<WakeLockSentinel | undefined> | undefined;
		const take = () => {
			if (!document.hidden) lock = navigator.wakeLock.request('screen').catch(() => undefined);
		};
		take();
		document.addEventListener('visibilitychange', take);
		return () => {
			document.removeEventListener('visibilitychange', take);
			void lock?.then((l) => l?.release());
		};
	});

	// Once told we're listening, the player posts its state several times a second.
	function listen(el: HTMLIFrameElement) {
		const send = (msg: object) => el.contentWindow?.postMessage(JSON.stringify(msg), YOUTUBE);
		// Where it was left on this device: it jumps there once it starts playing.
		let resumeAt = positionOf(id);
		let saved = 0;
		function save() {
			// Not until the jump back has landed, or a quick Back would save ~0 over it.
			if (!started || !duration || resumeAt) return;
			saved = time;
			savePosition(id, time, duration);
		}

		const hello = () => send({ event: 'listening', id: 1, channel: 'widget' });
		const onmessage = (e: MessageEvent) => {
			if (e.source !== el.contentWindow || typeof e.data !== 'string') return;
			type Info = { duration?: unknown; currentTime?: unknown; playerState?: unknown };
			let info: Info | null | undefined;
			try {
				info = (JSON.parse(e.data) as { info?: Info | null }).info;
			} catch {
				return;
			}
			if (!info) return;
			if (typeof info.duration === 'number' && info.duration > 0) duration = info.duration;
			if (typeof info.currentTime === 'number') time = info.currentTime;
			if (resumeAt && started && time >= resumeAt - 2) resumeAt = null;
			if (typeof info.playerState === 'number') {
				const state = info.playerState;
				// 1 playing, 3 buffering, 2 paused, 0 ended, -1 unstarted, 5 cued.
				playing = state === 1 || state === 3;
				if (playing && !started) {
					started = true;
					if (resumeAt) send({ event: 'command', func: 'seekTo', args: [resumeAt, true] });
				}
				if (state === 2) save();
				if (state === 0) {
					// Finished: forgotten, so next time it starts from the beginning.
					resumeAt = null;
					time = duration;
					save();
					onended();
					return;
				}
			}
			if (playing && Math.abs(time - saved) >= 15) save();
		};
		const onhide = () => document.hidden && save();
		el.addEventListener('load', hello);
		addEventListener('message', onmessage);
		document.addEventListener('visibilitychange', onhide);
		return () => {
			// Leaving the page (Back) saves too.
			save();
			document.removeEventListener('visibilitychange', onhide);
			el.removeEventListener('load', hello);
			removeEventListener('message', onmessage);
		};
	}
</script>

<div class="player">
	<iframe
		{@attach listen}
		{src}
		{title}
		allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
		allowfullscreen
		referrerpolicy="strict-origin-when-cross-origin"
	></iframe>
</div>

<style>
	.player {
		position: relative;
		aspect-ratio: 16 / 9;
		background: #000;
		border: 1px solid var(--green);
		border-radius: 2px;
		box-shadow: var(--glow);
		overflow: hidden;
	}
	iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
