import { describe, expect, it } from 'vitest';
import {
	addChannel,
	channelVideos,
	getVideo,
	listChannels,
	removeChannel,
	sync
} from './channels.ts';
import { fakeYoutube } from './fake-youtube.ts';
import { testDb } from './test-db.ts';
import type { ChannelInfo } from './youtube.ts';

const info = (id: string, title = id): ChannelInfo => ({
	id: `UC${id.padEnd(22, 'x')}`,
	title,
	handle: null,
	avatar: null
});

describe('channels', () => {
	it('adds a channel with its newest videos, then fetches older ones in syncs', async () => {
		const db = await testDb();
		const c = info('bluey', 'Bluey');
		await addChannel(db, fakeYoutube, c, new Date('2026-11-10T08:00:00Z'));
		expect(await listChannels(db)).toMatchObject([
			{ title: 'Bluey', videos: 3, fetchingOlder: true }
		]);

		// Checked just now, so the sync only goes back through older pages (two more).
		const done = await sync(db, fakeYoutube, new Date('2026-11-10T08:10:00Z'));
		expect(done).toEqual(['Bluey: older', 'Bluey: older']);
		expect(await listChannels(db)).toMatchObject([{ videos: 9, fetchingOlder: false }]);

		const { videos, more } = await channelVideos(db, c.id, 5);
		expect(videos).toHaveLength(5);
		expect(more).toBe(true);
		// Newest first.
		expect(videos[0].title).toMatch(/episode 9$/);
	});

	it('refreshes channels not checked for six hours', async () => {
		const db = await testDb();
		await addChannel(db, fakeYoutube, info('a'), new Date('2026-11-10T00:00:00Z'));
		await sync(db, fakeYoutube, new Date('2026-11-10T00:10:00Z'));
		expect(await sync(db, fakeYoutube, new Date('2026-11-10T05:00:00Z'))).toEqual([]);
		expect(await sync(db, fakeYoutube, new Date('2026-11-10T07:00:00Z'))).toEqual(['a: newest']);
	});

	it('only plays videos of allowed channels, and removing one removes its videos', async () => {
		const db = await testDb();
		const c = info('numberblocks');
		await addChannel(db, fakeYoutube, c);
		const [first] = (await channelVideos(db, c.id, 1)).videos;
		expect(await getVideo(db, first.id)).toMatchObject({ channelId: c.id });
		expect(await getVideo(db, 'notallowed1')).toBeNull();

		await removeChannel(db, c.id);
		expect(await getVideo(db, first.id)).toBeNull();
		expect(await listChannels(db)).toEqual([]);
	});
});
