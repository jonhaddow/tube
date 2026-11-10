import { error } from '@sveltejs/kit';
import { channelVideos, getChannel } from '#lib/server/channels.ts';
import type { PageServerLoad } from './$types';

const PAGE = 48;

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const c = await getChannel(locals.db, params.id);
	if (!c) error(404, 'No such channel');
	// "More videos" asks for the next lot on top (?n=96), so Back keeps the place.
	const n = Math.min(Math.max(PAGE, Number(url.searchParams.get('n')) || PAGE), 5000);
	return {
		channel: { id: c.id, title: c.title, avatar: c.avatar },
		...(await channelVideos(locals.db, c.id, n)),
		next: n + PAGE
	};
};
