// Where each video was left, on this device only (localStorage), so it carries on
// from there. Finished videos are forgotten; only the most recent 300 are kept.

const KEY = 'tube:positions';
const KEEP = 300;
/** Near the end counts as finished. The first few seconds aren't worth keeping. */
const END_SECONDS = 20;
const MIN_SECONDS = 10;

type Positions = Record<string, number>;

function read(storage: Storage): Positions {
	try {
		const value: unknown = JSON.parse(storage.getItem(KEY) ?? '{}');
		return value && typeof value === 'object' ? (value as Positions) : {};
	} catch {
		return {};
	}
}

/** Every saved position, by video id, in seconds. */
export function allPositions(storage: Storage = localStorage): Positions {
	return read(storage);
}

export function positionOf(id: string, storage: Storage = localStorage): number | null {
	return read(storage)[id] ?? null;
}

/** Saves where a video's got to, or forgets it if it's barely started or nearly done. */
export function savePosition(
	id: string,
	seconds: number,
	duration: number,
	storage: Storage = localStorage
) {
	const all = read(storage);
	delete all[id];
	const done = duration > 0 && seconds > duration - END_SECONDS;
	// Newest last, so trimming drops the oldest.
	if (!done && seconds >= MIN_SECONDS) all[id] = Math.floor(seconds);
	const ids = Object.keys(all);
	for (const old of ids.slice(0, Math.max(0, ids.length - KEEP))) delete all[old];
	try {
		storage.setItem(KEY, JSON.stringify(all));
	} catch {
		// Storage full or blocked (private browsing): resuming just won't work.
	}
}
