import { asc, count, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import type { DB } from './db/index.ts';
import { channel, video } from './db/schema.ts';
import type { ChannelInfo, VideoInfo, YouTube } from './youtube.ts';

/** How often a channel's newest videos are fetched again. */
const REFRESH_HOURS = 6;
/** Pages of 50 videos per sync: each is two YouTube calls and a few D1 queries. */
const PAGES_PER_SYNC = 8;
/** D1 allows 100 bound values per query; a video row has 5. */
const ROWS_PER_INSERT = 20;

/** Every channel, A to Z, with how many videos it has. */
export function listChannels(db: DB) {
	return db
		.select({
			id: channel.id,
			title: channel.title,
			handle: channel.handle,
			avatar: channel.avatar,
			fetchingOlder: sql<boolean>`${channel.olderPage} IS NOT NULL`.mapWith(Boolean),
			videos: count(video.id)
		})
		.from(channel)
		.leftJoin(video, eq(video.channelId, channel.id))
		.groupBy(channel.id)
		.orderBy(sql`${channel.title} COLLATE NOCASE`);
}

export async function getChannel(db: DB, id: string) {
	const [c] = await db.select().from(channel).where(eq(channel.id, id));
	return c ?? null;
}

/** A channel's newest `limit` videos, and whether there are more. */
export async function channelVideos(db: DB, channelId: string, limit: number) {
	const rows = await db
		.select({ id: video.id, title: video.title, seconds: video.seconds })
		.from(video)
		.where(eq(video.channelId, channelId))
		.orderBy(desc(video.publishedAt))
		.limit(limit + 1);
	return { videos: rows.slice(0, limit), more: rows.length > limit };
}

/** A video, if it's on an allowed channel (the only ones the player will play). */
export async function getVideo(db: DB, id: string) {
	const [v] = await db
		.select({
			id: video.id,
			title: video.title,
			channelId: channel.id,
			channelTitle: channel.title,
			avatar: channel.avatar
		})
		.from(video)
		.innerJoin(channel, eq(video.channelId, channel.id))
		.where(eq(video.id, id));
	return v ?? null;
}

async function saveVideos(db: DB, channelId: string, videos: VideoInfo[]) {
	const rows = videos.map((v) => ({ ...v, channelId }));
	const inserts = [];
	for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
		inserts.push(
			db
				.insert(video)
				.values(rows.slice(i, i + ROWS_PER_INSERT))
				.onConflictDoUpdate({
					target: video.id,
					set: { title: sql`excluded.title`, seconds: sql`excluded.seconds` }
				})
		);
	}
	const [first, ...rest] = inserts;
	if (first !== undefined) await db.batch([first, ...rest]);
}

/** Adds a channel with its newest videos; older ones follow in later syncs. */
export async function addChannel(db: DB, yt: YouTube, info: ChannelInfo, now = new Date()) {
	const page = await yt.uploads(info.id);
	await db
		.insert(channel)
		.values({
			...info,
			addedAt: now.toISOString(),
			checkedAt: now.toISOString(),
			olderPage: page.next
		})
		.onConflictDoUpdate({
			target: channel.id,
			set: { title: info.title, handle: info.handle, avatar: info.avatar }
		});
	await saveVideos(db, info.id, page.videos);
}

export async function removeChannel(db: DB, id: string) {
	// Its videos go too (on delete cascade), but D1 needs foreign keys spelled out.
	await db.batch([
		db.delete(video).where(eq(video.channelId, id)),
		db.delete(channel).where(eq(channel.id, id))
	]);
}

/**
 * Keeps the videos up to date, a few pages at a time (the cron calls it every 10
 * minutes): first the newest videos of channels not checked for a while, then
 * older videos of channels still being fetched, back to their first.
 */
export async function sync(db: DB, yt: YouTube, now = new Date()) {
	let pages = 0;
	const done: string[] = [];
	const stale = new Date(now.getTime() - REFRESH_HOURS * 3_600_000).toISOString();

	const due = await db
		.select({ id: channel.id, title: channel.title })
		.from(channel)
		.where(sql`${channel.checkedAt} IS NULL OR ${channel.checkedAt} < ${stale}`)
		.orderBy(asc(channel.checkedAt))
		.limit(PAGES_PER_SYNC);
	for (const c of due) {
		const page = await yt.uploads(c.id);
		await saveVideos(db, c.id, page.videos);
		await db.update(channel).set({ checkedAt: now.toISOString() }).where(eq(channel.id, c.id));
		done.push(`${c.title}: newest`);
		pages++;
	}

	while (pages < PAGES_PER_SYNC) {
		const [c] = await db
			.select({ id: channel.id, title: channel.title, olderPage: channel.olderPage })
			.from(channel)
			.where(isNotNull(channel.olderPage))
			.orderBy(asc(channel.addedAt))
			.limit(1);
		if (!c) break;
		const page = await yt.uploads(c.id, c.olderPage);
		await saveVideos(db, c.id, page.videos);
		await db.update(channel).set({ olderPage: page.next }).where(eq(channel.id, c.id));
		done.push(`${c.title}: older`);
		pages++;
	}
	return done;
}

/** Which of these channels are already on the list. */
export async function knownChannels(db: DB, ids: string[]) {
	if (!ids.length) return new Set<string>();
	const rows = await db.select({ id: channel.id }).from(channel).where(inArray(channel.id, ids));
	return new Set(rows.map((r) => r.id));
}
