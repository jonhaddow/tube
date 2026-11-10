import { error, json } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { sync } from '#lib/server/channels.ts';
import { youtube } from '#lib/server/youtube-client.ts';
import type { RequestHandler } from './$types';

/** Called by the cron (worker/entry.js) with the cron secret. */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET) error(403);
	return json(await sync(locals.db, youtube()));
};
