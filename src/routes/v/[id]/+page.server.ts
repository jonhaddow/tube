import { error } from '@sveltejs/kit';
import { getVideo } from '#lib/server/channels.ts';
import type { PageServerLoad } from './$types';

// Only videos from allowed channels play: anything else is a 404.
export const load: PageServerLoad = async ({ params, locals }) => {
	const video = await getVideo(locals.db, params.id);
	if (!video) error(404, 'No such video');
	return { video };
};
