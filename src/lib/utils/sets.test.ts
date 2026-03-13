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

	it('uses a bumper plate when the exact side weight matches', () => {
		expect(
			computeSmartSetSequence(
				[
					{ id: 1, percentage: '62.5' },
					{ id: 2, percentage: '75' }
				],
				20,
				40
			)[1].result.plates
		).toEqual([{ weight: 5, count: 1 }]);
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
		expect(sequence[1].removalCost).toBe(2);
		expect(sequence[1].upWeightMoveCost).toBe(4);
		expect(sequence[1].changeCost).toBe(4);
	});

	it('prefers heavier plates to keep the bar consistent across sets', () => {
		expect(
			computeSmartSetSequence(
				[
					{ id: 1, percentage: '95' }
				],
				20,
				80
			)[0].result.plates
		).toEqual([
			{ weight: 20, count: 1 },
			{ weight: 5, count: 1 },
			{ weight: 2.5, count: 1 },
			{ weight: 0.5, count: 1 }
		]);
	});

	it('limits change plates to 2 of the same weight per side', () => {
		const result = computeSmartSetSequence(
			[{ id: 1, percentage: '100' }],
			20,
			27.5
		)[0].result;

		for (const plate of result.plates) {
			if ([2.5, 2, 1.5, 1, 0.5].includes(plate.weight)) {
				expect(plate.count).toBeLessThanOrEqual(2);
			}
		}
	});
});