// The YouTube Data API (key: YOUTUBE_API_KEY, shared with Stash). Free quota is
// 10,000 units a day: lists cost 1 unit, a search 100.

export type Fetch = typeof fetch;

export type ChannelInfo = {
	id: string;
	title: string;
	handle: string | null;
	avatar: string | null;
};
export type VideoInfo = { id: string; title: string; publishedAt: string; seconds: number };
export type UploadsPage = { videos: VideoInfo[]; next: string | null };

export interface YouTube {
	/** The channel a link, @handle or channel id points at, or null if it isn't one. */
	channel(input: string): Promise<ChannelInfo | null>;
	/** Channels matching a name, best first. */
	search(q: string): Promise<ChannelInfo[]>;
	/** A page of a channel's uploads, newest first, with the token for the next (older) page. */
	uploads(channelId: string, page?: string | null): Promise<UploadsPage>;
}

const API = 'https://www.googleapis.com/youtube/v3';
/** Where it's watched: videos blocked here are left out. */
const REGION = 'GB';

type Region = { allowed?: string[]; blocked?: string[] };
const watchableHere = (r?: Region) =>
	!r || (!r.blocked?.includes(REGION) && (!r.allowed || r.allowed.includes(REGION)));

type Thumbs = { default?: { url: string }; medium?: { url: string } };
type ChannelList = {
	items?: { id: string; snippet: { title: string; customUrl?: string; thumbnails?: Thumbs } }[];
};
type SearchList = { items?: { snippet: { channelId: string } }[] };
type PlaylistItems = { nextPageToken?: string; items?: { contentDetails: { videoId: string } }[] };
type VideoList = {
	items?: {
		id: string;
		snippet: { title: string; publishedAt: string; liveBroadcastContent?: string };
		contentDetails: { duration: string; regionRestriction?: Region };
		status: { embeddable?: boolean; privacyStatus?: string };
	}[];
};

/** What someone might paste: a channel link, an @handle or a UC… id. Anything else is a name. */
export function parseChannelInput(
	input: string
): { id: string } | { handle: string } | { name: string } | null {
	const s = input.trim();
	if (!s) return null;
	const id = s.match(/(?:^|\/channel\/)(UC[\w-]{22})(?:[/?#]|$)/);
	if (id) return { id: id[1] };
	const handle = s.match(/(?:^|youtube\.com\/)(@[\w.-]+)/);
	if (handle) return { handle: handle[1] };
	if (/^https?:\/\/|youtube\.com|youtu\.be/.test(s)) return null;
	return { name: s };
}

/** ISO 8601 durations as YouTube gives them (PT1H2M3S, P1DT2H) to seconds. */
export function durationSeconds(iso: string) {
	const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
	if (!m) return 0;
	const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
	return ((d * 24 + h) * 60 + min) * 60 + s;
}

/** The real API. Throws on failure, with YouTube's status in the message. */
export function youtubeApi(key: string, fetcher: Fetch = fetch): YouTube {
	async function get<T>(path: string, params: Record<string, string>): Promise<T | null> {
		const url = `${API}/${path}?${new URLSearchParams({ ...params, key })}`;
		const res = await fetcher(url, { headers: { accept: 'application/json' } });
		// A channel with no long videos has no uploads playlist.
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`YouTube answered ${res.status}`);
		return res.json() as Promise<T>;
	}

	async function channels(params: Record<string, string>): Promise<ChannelInfo[]> {
		const list = await get<ChannelList>('channels', { part: 'snippet', ...params });
		return (list?.items ?? []).map((c) => ({
			id: c.id,
			title: c.snippet.title,
			handle: c.snippet.customUrl?.startsWith('@') ? c.snippet.customUrl : null,
			avatar: c.snippet.thumbnails?.medium?.url ?? c.snippet.thumbnails?.default?.url ?? null
		}));
	}

	return {
		async channel(input) {
			const parsed = parseChannelInput(input);
			if (!parsed || 'name' in parsed) return null;
			const found = await channels(
				'id' in parsed ? { id: parsed.id } : { forHandle: parsed.handle }
			);
			return found[0] ?? null;
		},

		async search(q) {
			const hits = await get<SearchList>('search', {
				part: 'snippet',
				type: 'channel',
				maxResults: '6',
				q
			});
			const ids = (hits?.items ?? []).map((h) => h.snippet.channelId);
			if (!ids.length) return [];
			const found = await channels({ id: ids.join(',') });
			return ids.flatMap((id) => found.find((c) => c.id === id) ?? []);
		},

		async uploads(channelId, page) {
			// UULF… is the channel's uploads without Shorts (UU… has them all).
			const list = await get<PlaylistItems>('playlistItems', {
				part: 'contentDetails',
				playlistId: `UULF${channelId.slice(2)}`,
				maxResults: '50',
				...(page ? { pageToken: page } : {})
			});
			const ids = (list?.items ?? []).map((i) => i.contentDetails.videoId);
			if (!ids.length) return { videos: [], next: null };
			// The playlist doesn't say which can be embedded, or how long they are.
			const details = await get<VideoList>('videos', {
				part: 'snippet,contentDetails,status',
				id: ids.join(',')
			});
			const videos = (details?.items ?? [])
				.filter(
					(v) =>
						v.status.embeddable !== false &&
						watchableHere(v.contentDetails.regionRestriction) &&
						v.status.privacyStatus === 'public' &&
						(v.snippet.liveBroadcastContent ?? 'none') === 'none'
				)
				.map((v) => ({
					id: v.id,
					title: v.snippet.title,
					publishedAt: v.snippet.publishedAt,
					seconds: durationSeconds(v.contentDetails.duration)
				}));
			return { videos, next: list?.nextPageToken ?? null };
		}
	};
}
