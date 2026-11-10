<script lang="ts">
	import { page } from '$app/state';
	import { positionOf, savePosition } from '#lib/positions.ts';
	import { clock } from '#lib/time.ts';

	// YouTube's no-cookie player with its own controls hidden and a shield over it,
	// so nothing in it can be tapped: no title, logo or suggestions leading out to
	// YouTube. Our buttons below drive it through the embed's postMessage API.
	let { id, title, onended }: { id: string; title: string; onended: () => void } = $props();

	const YOUTUBE = 'https://www.youtube-nocookie.com';
	const PARAMS =
		'autoplay=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&playsinline=1&rel=0&enablejsapi=1';

	let frame = $state<HTMLIFrameElement>();
	let box = $state<HTMLDivElement>();
	let playing = $state(false);
	let started = $state(false);
	/** The player said it's waiting to start (unstarted or cued): not an error screen. */
	let waiting = false;
	/** YouTube can't play it here (age limit, made private since…): our own message instead. */
	let failed = $state(false);
	/** Autoplay was refused (iPad Safari can): the first tap goes to YouTube's own play button. */
	let needsTap = $state(false);
	let time = $state(0);
	let duration = $state(0);
	let seeking = $state(false);
	/** Real fullscreen (iPad, computers). */
	let native = $state(false);
	/** iPhones can't make an element fullscreen: the player fills the window instead. */
	let filling = $state(false);
	let canFullscreen = false;
	const fullscreen = $derived(native || filling);

	const src = $derived(
		`${YOUTUBE}/embed/${id}?${PARAMS}&origin=${encodeURIComponent(page.url.origin)}`
	);

	function command(func: string, args: unknown[] = []) {
		frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YOUTUBE);
	}

	// Where it was left on this device: it jumps there once it starts playing.
	let resumeAt: number | null = null;
	let saved = 0;
	function save() {
		// Not until the jump back has landed, or a quick Back would save ~0 over it.
		if (!started || !duration || resumeAt) return;
		saved = time;
		savePosition(id, time, duration);
	}

	const toggle = () => command(playing ? 'pauseVideo' : 'playVideo');

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
		let timer: ReturnType<typeof setTimeout> | undefined;
		resumeAt = positionOf(id);
		const hello = () => {
			el.contentWindow?.postMessage(
				JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
				YOUTUBE
			);
			timer = setTimeout(() => (needsTap = waiting && !started && !failed), 2000);
		};
		const onmessage = (e: MessageEvent) => {
			if (e.source !== el.contentWindow || typeof e.data !== 'string') return;
			type Info = { duration?: unknown; currentTime?: unknown; playerState?: unknown };
			let msg: { event?: unknown; info?: Info | null };
			try {
				msg = JSON.parse(e.data) as typeof msg;
			} catch {
				return;
			}
			// Its error screen has a "Watch on YouTube" link: keep the shield shut over it.
			if (msg.event === 'onError') {
				failed = true;
				needsTap = false;
				return;
			}
			const info = msg.info;
			if (!info) return;
			if (typeof info.duration === 'number' && info.duration > 0) duration = info.duration;
			if (typeof info.currentTime === 'number' && !seeking) time = info.currentTime;
			if (resumeAt && started && time >= resumeAt - 2) resumeAt = null;
			if (typeof info.playerState === 'number') {
				const state = info.playerState;
				// 1 playing, 3 buffering, 2 paused, 0 ended, -1 unstarted, 5 cued.
				playing = state === 1 || state === 3;
				if (state === -1 || state === 5) waiting = true;
				if (playing && !started) {
					started = true;
					if (resumeAt) command('seekTo', [resumeAt, true]);
				}
				if (started) needsTap = false;
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
			clearTimeout(timer);
			el.removeEventListener('load', hello);
			removeEventListener('message', onmessage);
		};
	}

	function trackFullscreen() {
		canFullscreen =
			document.fullscreenEnabled || 'webkitRequestFullscreen' in document.documentElement;
		const update = () =>
			(native = !!(
				document.fullscreenElement ??
				(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
			));
		document.addEventListener('fullscreenchange', update);
		document.addEventListener('webkitfullscreenchange', update);
		return () => {
			document.removeEventListener('fullscreenchange', update);
			document.removeEventListener('webkitfullscreenchange', update);
		};
	}

	type WebkitEl = HTMLElement & { webkitRequestFullscreen?: () => void };
	type WebkitDoc = Document & { webkitExitFullscreen?: () => void };
	function toggleFullscreen() {
		if (!canFullscreen) {
			filling = !filling;
			return;
		}
		const d = document as WebkitDoc;
		if (native) {
			if (d.exitFullscreen) void d.exitFullscreen();
			else d.webkitExitFullscreen?.();
		} else if (box) {
			const el = box as WebkitEl;
			if (el.requestFullscreen) void el.requestFullscreen();
			else el.webkitRequestFullscreen?.();
		}
	}
</script>

<svelte:document {@attach trackFullscreen} />

<div class="player" class:fullscreen bind:this={box}>
	<div class="screen">
		<iframe
			bind:this={frame}
			{@attach listen}
			{src}
			{title}
			tabindex="-1"
			allow="autoplay; encrypted-media"
			referrerpolicy="strict-origin-when-cross-origin"
		></iframe>
		{#if failed}
			<p class="failed">This video won’t play here. Pick another one.</p>
		{/if}
		<!-- Taps on the video play and pause; none reach YouTube's links. -->
		<div class="shield" class:open={needsTap} aria-hidden="true">
			{#each Array(9), i (i)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div onclick={toggle}></div>
			{/each}
		</div>
	</div>

	<div class="controls">
		<button
			class="play"
			onclick={toggle}
			aria-label={playing ? 'Pause' : 'Play'}
			disabled={!started && !needsTap}
		>
			{#if playing}
				<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
					<rect x="5" y="4" width="5" height="16" rx="1.5" fill="currentColor" />
					<rect x="14" y="4" width="5" height="16" rx="1.5" fill="currentColor" />
				</svg>
			{:else}
				<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"
						fill="currentColor"
					/>
				</svg>
			{/if}
		</button>
		<input
			class="seek"
			type="range"
			min="0"
			max={duration || 1}
			step="1"
			aria-label="Position"
			disabled={!started}
			bind:value={time}
			oninput={() => (seeking = true)}
			onchange={() => {
				resumeAt = null;
				command('seekTo', [time, true]);
				seeking = false;
			}}
			style:--done="{duration ? (time / duration) * 100 : 0}%"
		/>
		<span class="time">{clock(time)} / {clock(duration)}</span>
		<button
			class="full"
			onclick={toggleFullscreen}
			aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
		>
			<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
				{#if fullscreen}
					<path
						d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{:else}
					<path
						d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{/if}
			</svg>
		</button>
	</div>
</div>

<style>
	.player {
		display: flex;
		flex-direction: column;
		background: #000;
		border: 1px solid var(--green);
		border-radius: 2px;
		box-shadow: var(--glow);
		overflow: hidden;
	}
	.player.fullscreen {
		position: fixed;
		inset: 0;
		z-index: 50;
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		border: 0;
		box-shadow: none;
	}
	.screen {
		position: relative;
		aspect-ratio: 16 / 9;
		background: #000;
	}
	.fullscreen .screen {
		flex: 1;
		aspect-ratio: auto;
	}
	iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
	.failed {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 24px;
		text-align: center;
		color: var(--amber);
		background: #000;
	}
	.shield {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template: 1fr 2fr 1fr / 1fr 2fr 1fr;
	}
	/* Autoplay refused: let the first tap through to YouTube's play button in the middle. */
	.shield.open > :nth-child(5) {
		pointer-events: none;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
		background: var(--panel);
		border-top: 1px solid var(--green-dim);
	}
	.play,
	.full {
		display: grid;
		place-items: center;
		flex: none;
		width: 54px;
		height: 54px;
		padding: 0;
		color: var(--bg);
		background: var(--green);
		border: 0;
		border-radius: 2px;
		box-shadow: var(--glow);
		cursor: pointer;
	}
	.full {
		width: 48px;
		height: 48px;
		color: var(--green);
		background: transparent;
		border: 1px solid var(--green);
		box-shadow: none;
	}
	.play:active {
		background: var(--text);
	}
	.full:active {
		background: var(--green);
		color: var(--bg);
	}
	.play:disabled {
		opacity: 0.4;
	}
	.time {
		flex: none;
		font-size: 14px;
		font-weight: 600;
		color: var(--green);
		font-variant-numeric: tabular-nums;
	}
	.seek {
		flex: 1;
		min-width: 0;
		height: 36px;
		margin: 0;
		background: transparent;
		-webkit-appearance: none;
		appearance: none;
	}
	.seek::-webkit-slider-runnable-track {
		height: 8px;
		border: 1px solid var(--green-dim);
		background: linear-gradient(90deg, var(--green) var(--done), var(--bg) var(--done));
	}
	.seek::-moz-range-track {
		height: 8px;
		border: 1px solid var(--green-dim);
		background: linear-gradient(90deg, var(--green) var(--done), var(--bg) var(--done));
	}
	.seek::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 28px;
		margin-top: -11px;
		background: var(--green);
		border: 0;
		border-radius: 1px;
		box-shadow: var(--glow);
	}
	.seek::-moz-range-thumb {
		width: 14px;
		height: 28px;
		background: var(--green);
		border: 0;
		border-radius: 1px;
	}
</style>
