<script lang="ts">
	import { page } from '$app/state';
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
	/** Autoplay was refused (iPad Safari can): the first tap goes to YouTube's own play button. */
	let needsTap = $state(false);
	let time = $state(0);
	let duration = $state(0);
	let seeking = $state(false);
	let fullscreen = $state(false);
	let canFullscreen = $state(false);

	const src = $derived(
		`${YOUTUBE}/embed/${id}?${PARAMS}&origin=${encodeURIComponent(page.url.origin)}`
	);

	function command(func: string, args: unknown[] = []) {
		frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YOUTUBE);
	}

	const toggle = () => command(playing ? 'pauseVideo' : 'playVideo');

	// Once told we're listening, the player posts its state several times a second.
	function listen(el: HTMLIFrameElement) {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const hello = () => {
			el.contentWindow?.postMessage(
				JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
				YOUTUBE
			);
			timer = setTimeout(() => (needsTap = !started), 2000);
		};
		const onmessage = (e: MessageEvent) => {
			if (e.source !== el.contentWindow || typeof e.data !== 'string') return;
			let info: { duration?: unknown; currentTime?: unknown; playerState?: unknown } | undefined;
			try {
				info = (JSON.parse(e.data) as { info?: typeof info }).info;
			} catch {
				return;
			}
			if (!info) return;
			if (typeof info.duration === 'number' && info.duration > 0) duration = info.duration;
			if (typeof info.currentTime === 'number' && !seeking) time = info.currentTime;
			if (typeof info.playerState === 'number') {
				const state = info.playerState;
				// 1 playing, 3 buffering, 2 paused, 0 ended.
				playing = state === 1 || state === 3;
				if (playing) started = true;
				if (started) needsTap = false;
				if (state === 0) onended();
			}
		};
		el.addEventListener('load', hello);
		addEventListener('message', onmessage);
		return () => {
			clearTimeout(timer);
			el.removeEventListener('load', hello);
			removeEventListener('message', onmessage);
		};
	}

	function trackFullscreen() {
		canFullscreen =
			document.fullscreenEnabled || 'webkitRequestFullscreen' in document.documentElement;
		const update = () =>
			(fullscreen = !!(
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
		const d = document as WebkitDoc;
		if (fullscreen) {
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
				command('seekTo', [time, true]);
				seeking = false;
			}}
			style:--done="{duration ? (time / duration) * 100 : 0}%"
		/>
		<span class="time">{clock(time)} / {clock(duration)}</span>
		{#if canFullscreen}
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
		{/if}
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
		width: 100vw;
		height: 100vh;
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
