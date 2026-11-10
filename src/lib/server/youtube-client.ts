import { dev } from '$app/env';
import { env } from 'cloudflare:workers';
import { fakeYoutube } from './fake-youtube.ts';
import { youtubeApi, type YouTube } from './youtube.ts';

/**
 * The real API, or made-up channels (fake-youtube.ts) in local development
 * without a key, and always in e2e and shot.sh (FAKE_YOUTUBE).
 */
export function youtube(): YouTube {
	if (dev && (process.env.FAKE_YOUTUBE || !env.YOUTUBE_API_KEY)) return fakeYoutube;
	return youtubeApi(env.YOUTUBE_API_KEY!);
}
