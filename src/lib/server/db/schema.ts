import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Times are ISO timestamps.

/** People who can sign in (Google accounts): the grown-ups who choose the channels. */
export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name').notNull()
});

export type User = typeof user.$inferSelect;

/** Signed-in sessions. The id is the SHA-256 of the cookie's token, never the token itself. */
export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: text('expires_at').notNull()
	},
	(t) => [index('session_user_idx').on(t.userId)]
);

/** A YouTube channel on the allowlist: the only videos the kids can see. */
export const channel = sqliteTable('channel', {
	/** YouTube's channel id (UC…). */
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	/** @handle, if it has one. */
	handle: text('handle'),
	avatar: text('avatar'),
	addedAt: text('added_at').notNull(),
	/** When its newest videos were last fetched (the sync refreshes the stalest first). */
	checkedAt: text('checked_at'),
	/**
	 * Where fetching its older videos got to (YouTube's page token), working back
	 * through the whole channel a few pages per sync. Null once it's reached the start.
	 */
	olderPage: text('older_page')
});

export type Channel = typeof channel.$inferSelect;

/** A channel's video (no Shorts, live streams or videos that can't be embedded). */
export const video = sqliteTable(
	'video',
	{
		id: text('id').primaryKey(),
		channelId: text('channel_id')
			.notNull()
			.references(() => channel.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		publishedAt: text('published_at').notNull(),
		/** Length in seconds. */
		seconds: integer('seconds').notNull()
	},
	(t) => [index('video_channel_idx').on(t.channelId, t.publishedAt)]
);

export type Video = typeof video.$inferSelect;

/** One row: when a sync last started, so visits start one at most every 10 minutes. */
export const syncState = sqliteTable('sync_state', {
	id: integer('id').primaryKey(),
	startedAt: text('started_at').notNull()
});
