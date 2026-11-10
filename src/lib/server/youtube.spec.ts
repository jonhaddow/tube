import { describe, expect, it } from 'vitest';
import { durationSeconds, parseChannelInput, youtubeApi, type Fetch } from './youtube.ts';

const ID = 'UCabcdefghijklmnopqrstuv';

describe('parseChannelInput', () => {
	it('reads links, handles and ids', () => {
		expect(parseChannelInput(`https://www.youtube.com/channel/${ID}/videos`)).toEqual({ id: ID });
		expect(parseChannelInput(ID)).toEqual({ id: ID });
		expect(parseChannelInput('https://youtube.com/@Bluey.Official?si=x')).toEqual({
			handle: '@Bluey.Official'
		});
		expect(parseChannelInput(' @numberblocks ')).toEqual({ handle: '@numberblocks' });
	});

	it('treats anything else as a name, except other YouTube links', () => {
		expect(parseChannelInput('Art for Kids Hub')).toEqual({ name: 'Art for Kids Hub' });
		expect(parseChannelInput('https://www.youtube.com/watch?v=abc')).toBeNull();
		expect(parseChannelInput('  ')).toBeNull();
	});
});

describe('durationSeconds', () => {
	it('reads YouTube durations', () => {
		expect(durationSeconds('PT4M5S')).toBe(245);
		expect(durationSeconds('PT1H')).toBe(3600);
		expect(durationSeconds('P1DT1S')).toBe(86401);
		expect(durationSeconds('P0D')).toBe(0);
		expect(durationSeconds('nonsense')).toBe(0);
	});
});

/** A fetch that answers each API path with canned JSON, and records the URLs. */
function fake(answers: Record<string, unknown>) {
	const urls: URL[] = [];
	const fetcher = (async (input: string) => {
		const url = new URL(input);
		urls.push(url);
		const body = answers[url.pathname.split('/').pop()!];
		return body === undefined
			? new Response('', { status: 404 })
			: new Response(JSON.stringify(body), { status: 200 });
	}) as unknown as Fetch;
	return { fetcher, urls };
}

describe('youtubeApi uploads', () => {
	it('lists the uploads without Shorts, dropping ones that can’t be embedded, are live, age-restricted or blocked in the UK', async () => {
		const video = (id: string, extra: object = {}) => ({
			id,
			snippet: { title: id, publishedAt: '2026-11-01T00:00:00Z', liveBroadcastContent: 'none' },
			contentDetails: { duration: 'PT1M' },
			status: { embeddable: true, privacyStatus: 'public' },
			...extra
		});
		const { fetcher, urls } = fake({
			playlistItems: {
				nextPageToken: 'P2',
				items: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((videoId) => ({
					contentDetails: { videoId }
				}))
			},
			videos: {
				items: [
					video('a'),
					video('g', {
						contentDetails: { duration: 'PT1M', contentRating: { ytRating: 'ytAgeRestricted' } }
					}),
					video('e', {
						contentDetails: { duration: 'PT1M', regionRestriction: { blocked: ['GB'] } }
					}),
					video('f', {
						contentDetails: { duration: 'PT1M', regionRestriction: { allowed: ['US'] } }
					}),
					video('b', { status: { embeddable: false, privacyStatus: 'public' } }),
					video('c', {
						snippet: {
							title: 'c',
							publishedAt: '2026-11-01T00:00:00Z',
							liveBroadcastContent: 'live'
						}
					})
				]
			}
		});
		const page = await youtubeApi('KEY', fetcher).uploads(ID, 'P1');
		expect(page).toEqual({
			videos: [{ id: 'a', title: 'a', publishedAt: '2026-11-01T00:00:00Z', seconds: 60 }],
			next: 'P2'
		});
		expect(urls[0].searchParams.get('playlistId')).toBe(`UULF${ID.slice(2)}`);
		expect(urls[0].searchParams.get('pageToken')).toBe('P1');
	});

	it('gives an empty page for a channel with no long videos', async () => {
		const { fetcher } = fake({});
		expect(await youtubeApi('KEY', fetcher).uploads(ID)).toEqual({ videos: [], next: null });
	});

	it('looks channels up by handle', async () => {
		const { fetcher, urls } = fake({
			channels: {
				items: [
					{
						id: ID,
						snippet: {
							title: 'Bluey',
							customUrl: '@blueyofficial',
							thumbnails: { medium: { url: 'pic' } }
						}
					}
				]
			}
		});
		expect(await youtubeApi('KEY', fetcher).channel('@BlueyOfficial')).toEqual({
			id: ID,
			title: 'Bluey',
			handle: '@blueyofficial',
			avatar: 'pic'
		});
		expect(urls[0].searchParams.get('forHandle')).toBe('@BlueyOfficial');
	});
});
