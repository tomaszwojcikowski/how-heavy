import { describe, expect, it } from 'vitest';

import { buildRoundedWarmupSteps, buildSetStepsFromTemplate, computeSmartSetSequence, SET_TEMPLATES } from './sets';

describe('set templates', () => {
	it('builds stable step ids from a template sequence', () => {
		expect(buildSetStepsFromTemplate(['40', '50', '60'])).toEqual([
			{ id: 1, percentage: '40' },
			{ id: 2, percentage: '50' },
			{ id: 3, percentage: '60' }
		]);
	});

	it('ships a warm-up ramp preset for quick 1RM-based setup', () => {
		expect(SET_TEMPLATES.find((template) => template.id === 'warmup-ramp')).toEqual({
			id: 'warmup-ramp',
			label: '3-step warm-up',
			description: 'Three rounded loads that are faster to build on the bar.',
			buildSteps: expect.any(Function)
		});
	});

	it('builds three rounded warm-up loads from the current 1RM', () => {
		expect(buildRoundedWarmupSteps(123, 20)).toEqual([
			{ id: 1, percentage: '44.72' },
			{ id: 2, percentage: '60.98' },
			{ id: 3, percentage: '73.17' }
		]);
	});

	it('keeps two matching small plates per side before consolidating to a larger plate', () => {
		expect(
			computeSmartSetSequence(
				[
					{ id: 1, percentage: '62.5' },
					{ id: 2, percentage: '75' }
				],
				20,
				40
			)[1].result.plates
		).toEqual([{ weight: 2.5, count: 2 }]);
	});

	it('counts how many moves it takes to increase the load', () => {
		const sequence = computeSmartSetSequence(
			[
				{ id: 1, percentage: '62.5' },
				{ id: 2, percentage: '75' }
			],
			20,
			40
		);

		expect(sequence[1].additionCost).toBe(2);
		expect(sequence[1].removalCost).toBe(0);
		expect(sequence[1].upWeightMoveCost).toBe(2);
		expect(sequence[1].changeCost).toBe(2);
	});

	it('penalizes three matching change plates on one side when a cleaner option exists', () => {
		expect(
			computeSmartSetSequence(
				[
					{ id: 1, percentage: '95' }
				],
				20,
				80
			)[0].result.plates
		).toEqual([
			{ weight: 15, count: 1 },
			{ weight: 10, count: 1 },
			{ weight: 2.5, count: 1 },
			{ weight: 0.5, count: 1 }
		]);
	});
});