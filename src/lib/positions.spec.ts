import { describe, expect, it } from 'vitest';
import { allPositions, positionOf, savePosition } from './positions.ts';

function memory(): Storage {
	const data = new Map<string, string>();
	return {
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => void data.set(k, v),
		removeItem: (k) => void data.delete(k),
		clear: () => data.clear(),
		key: (i) => [...data.keys()][i] ?? null,
		get length() {
			return data.size;
		}
	};
}

describe('positions', () => {
	it('remembers where a video got to', () => {
		const s = memory();
		savePosition('a', 125.7, 600, s);
		expect(positionOf('a', s)).toBe(125);
		expect(positionOf('b', s)).toBeNull();
	});

	it('forgets videos barely started or nearly finished', () => {
		const s = memory();
		savePosition('a', 300, 600, s);
		savePosition('a', 590, 600, s);
		expect(positionOf('a', s)).toBeNull();
		savePosition('b', 4, 600, s);
		expect(positionOf('b', s)).toBeNull();
	});

	it('keeps only the most recent 300', () => {
		const s = memory();
		for (let i = 0; i < 305; i++) savePosition(`v${i}`, 60, 600, s);
		savePosition('v0', 60, 600, s);
		const all = allPositions(s);
		expect(Object.keys(all)).toHaveLength(300);
		expect(all.v5).toBeUndefined();
		expect(all.v0).toBe(60);
	});

	it('survives rubbish in storage', () => {
		const s = memory();
		s.setItem('tube:positions', 'not json');
		expect(positionOf('a', s)).toBeNull();
	});
});
