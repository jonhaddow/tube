import type { ChannelInfo, YouTube } from './youtube.ts';
import { parseChannelInput } from './youtube.ts';

// Made-up channels for local development and the e2e tests, used when there's
// no YOUTUBE_API_KEY. Any @handle or name finds a channel; ids are made from it.

/** The name a made-up channel id was made from. */
const nameOf = (id: string) => id.slice(2).replace(/x+$/, '');

function made(name: string): ChannelInfo {
	const slug = name.replace(/^@/, '').replace(/[^\w]/g, '').slice(0, 20) || 'channel';
	return {
		id: `UC${slug.padEnd(22, 'x')}`,
		title: slug.replace(/^\w/, (c) => c.toUpperCase()),
		handle: `@${slug.toLowerCase()}`,
		avatar: null
	};
}

export const fakeYoutube: YouTube = {
	async channel(input) {
		const parsed = parseChannelInput(input);
		if (!parsed || 'name' in parsed) return null;
		return 'handle' in parsed ? made(parsed.handle) : { ...made(nameOf(parsed.id)), id: parsed.id };
	},
	async search(q) {
		return [made(q), made(`${q} kids`)];
	},
	async uploads(channelId, page) {
		// Three pages of three, so fetching older videos has something to do.
		const n = Number(page ?? 0);
		const videos = [0, 1, 2].map((i) => {
			const k = n * 3 + i;
			const name = nameOf(channelId);
			return {
				id: `${name.slice(0, 7)}-${k}`.padEnd(11, 'v'),
				title: `${name} episode ${9 - k}`,
				publishedAt: new Date(Date.UTC(2026, 9, 30 - k)).toISOString(),
				seconds: 300 + k * 61
			};
		});
		return { videos, next: n < 2 ? String(n + 1) : null };
	}
};
