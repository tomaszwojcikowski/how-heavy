import { describe, expect, it } from 'vitest';

import { calculateCurrentLoad, calculateOneSideWeight, getPlateCombinationForSideWeight, resolveTargetLoad, summarizePlateCounts } from './calculations';

describe('plate calculation engine', () => {
	it('prefers the tie-break combination when multiple exact side loads exist', () => {
		expect(getPlateCombinationForSideWeight(25)).toEqual([
			{ weight: 15, count: 1 },
			{ weight: 10, count: 1 }
		]);
	});

	it('picks a practical exact load for a target total', () => {
		const result = resolveTargetLoad(20, 100);

		expect(result.status).toBe('exact');
		expect(result.resolvedTotal).toBe(100);
		expect(result.oneSideWeight).toBe(40);
		expect(result.plates).toEqual([{ weight: 20, count: 2 }]);
	});

	it('rounds to the nearest achievable total when needed', () => {
		const result = resolveTargetLoad(15, 15.75);

		expect(result.status).toBe('rounded');
		expect(result.resolvedTotal).toBe(16);
		expect(result.delta).toBe(0.25);
		expect(result.plates).toEqual([{ weight: 0.5, count: 1 }]);
	});

	it('prefers rounding down when both neighboring totals are equally close', () => {
		const result = resolveTargetLoad(20, 100.25);

		expect(result.status).toBe('rounded');
		expect(result.resolvedTotal).toBe(100);
		expect(result.delta).toBe(-0.25);
	});

	it('supports heavier exact loads through the lookup table', () => {
		const result = resolveTargetLoad(20, 220);

		expect(result.status).toBe('exact');
		expect(result.resolvedTotal).toBe(220);
		expect(result.oneSideWeight).toBe(100);
		expect(result.plates).toEqual([{ weight: 20, count: 5 }]);
	});

	it('rejects targets below the bar weight', () => {
		const result = resolveTargetLoad(20, 18);

		expect(result.status).toBe('below-bar');
		expect(result.resolvedTotal).toBeNull();
		expect(result.plates).toEqual([]);
	});

	it('computes the current total from one-side plates', () => {
		const summary = calculateCurrentLoad(20, [20, 10, 2.5]);

		expect(summary.oneSideWeight).toBe(32.5);
		expect(summary.totalWeight).toBe(85);
	});

	it('returns null for impossible one-side weights', () => {
		expect(getPlateCombinationForSideWeight(0.25)).toBeNull();
	});

	it('keeps the one-side weight calculation precise', () => {
		expect(calculateOneSideWeight([2.5, 1.25, 0.5])).toBe(4.25);
	});

	it('groups repeated plates in display order', () => {
		expect(summarizePlateCounts([2.5, 20, 2.5, 1])).toEqual([
			{ weight: 20, count: 1 },
			{ weight: 2.5, count: 2 },
			{ weight: 1, count: 1 }
		]);
	});
});