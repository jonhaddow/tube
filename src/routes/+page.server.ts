import { kidsChannels } from '#lib/server/channels.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	channels: await kidsChannels(locals.db)
});
