import { listChannels } from '#lib/server/channels.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	channels: (await listChannels(locals.db)).filter((c) => c.videos > 0)
});
