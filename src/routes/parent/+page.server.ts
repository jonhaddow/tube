import { fail } from '@sveltejs/kit';
import { addChannel, knownChannels, listChannels, removeChannel } from '#lib/server/channels.ts';
import { parseChannelInput, type ChannelInfo } from '#lib/server/youtube.ts';
import { youtube } from '#lib/server/youtube-client.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	channels: await listChannels(locals.db),
	user: locals.user!.name
});

const failed = (q: string, error: string) => fail(400, { q, error });

async function add(locals: App.Locals, info: ChannelInfo) {
	await addChannel(locals.db, youtube(), info);
	return { added: info.title };
}

export const actions: Actions = {
	/** A link or @handle adds that channel; a name searches. */
	add: async ({ request, locals }) => {
		const q = String((await request.formData()).get('q') ?? '').trim();
		const parsed = parseChannelInput(q);
		if (!parsed) return failed(q, 'That isn’t a YouTube channel link.');
		const yt = youtube();
		try {
			if ('name' in parsed) {
				const results = await yt.search(parsed.name);
				const known = await knownChannels(
					locals.db,
					results.map((r) => r.id)
				);
				return { q, results: results.map((r) => ({ ...r, known: known.has(r.id) })) };
			}
			const info = await yt.channel(q);
			if (!info) return failed(q, 'Couldn’t find that channel on YouTube.');
			return await add(locals, info);
		} catch (e) {
			console.error('Adding a channel failed', e);
			return failed(q, 'YouTube isn’t answering. Try again in a minute.');
		}
	},

	/** One of the search results. */
	pick: async ({ request, locals }) => {
		const id = String((await request.formData()).get('id') ?? '');
		try {
			const info = await youtube().channel(id);
			if (!info) return failed('', 'Couldn’t find that channel on YouTube.');
			return await add(locals, info);
		} catch (e) {
			console.error('Adding a channel failed', e);
			return failed('', 'YouTube isn’t answering. Try again in a minute.');
		}
	},

	remove: async ({ request, locals }) => {
		await removeChannel(locals.db, String((await request.formData()).get('id') ?? ''));
		return { removed: true };
	}
};
