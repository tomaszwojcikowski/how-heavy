import { PLATE_DEFINITIONS, fromQuarterKiloUnits, isSupportedBarWeight, toQuarterKiloUnits } from '$lib/utils/plates';
import type { BarWeight, CurrentLoadSummary, PlateCount, PlateWeight, TargetLoadResult } from '$lib/types/gym';

const SEARCH_STEP_UNITS = 2;

function normalizeWeight(value: number): number {
	return Number.parseFloat(value.toFixed(2));
}

function compareCombinationCounts(candidate: number[], best: number[]): number {
	const candidatePlateCount = candidate.reduce((sum, count) => sum + count, 0);
	const bestPlateCount = best.reduce((sum, count) => sum + count, 0);

	if (candidatePlateCount !== bestPlateCount) {
		return candidatePlateCount - bestPlateCount;
	}

	for (let index = 0; index < candidate.length; index += 1) {
		if (candidate[index] !== best[index]) {
			return best[index] - candidate[index];
		}
	}

	return 0;
}

function alignRequestedUnits(barUnits: number, targetUnits: number): number {
	const parityOffset = (targetUnits - barUnits) % SEARCH_STEP_UNITS;

	if (parityOffset === 0) {
		return targetUnits;
	}

	return targetUnits - parityOffset;
}

export function getPlateCombinationForSideWeight(sideWeight: number): PlateCount[] | null {
	if (!Number.isFinite(sideWeight) || sideWeight < 0) {
		return null;
	}

	const targetUnits = toQuarterKiloUnits(sideWeight);

	if (targetUnits === 0) {
		return [];
	}

	const combinations: Array<number[] | null> = Array.from({ length: targetUnits + 1 }, () => null);
	combinations[0] = Array.from({ length: PLATE_DEFINITIONS.length }, () => 0);

	for (let units = 1; units <= targetUnits; units += 1) {
		let bestCombination: number[] | null = null;

		for (let index = 0; index < PLATE_DEFINITIONS.length; index += 1) {
			const plate = PLATE_DEFINITIONS[index];
			const remainder = units - plate.units;

			if (remainder < 0 || combinations[remainder] === null) {
				continue;
			}

			const candidate = [...(combinations[remainder] as number[])];
			candidate[index] += 1;

			if (!bestCombination || compareCombinationCounts(candidate, bestCombination) < 0) {
				bestCombination = candidate;
			}
		}

		combinations[units] = bestCombination;
	}

	const resolvedCombination = combinations[targetUnits];

	if (!resolvedCombination) {
		return null;
	}

	return resolvedCombination
		.map((count, index) => ({ weight: PLATE_DEFINITIONS[index].weight, count }))
		.filter((plate): plate is PlateCount => plate.count > 0);
}

export function calculateOneSideWeight(plates: readonly PlateWeight[]): number {
	return normalizeWeight(plates.reduce((sum, plateWeight) => sum + plateWeight, 0));
}

export function summarizePlateCounts(plates: readonly PlateWeight[]): PlateCount[] {
	return PLATE_DEFINITIONS.map((definition) => ({
		weight: definition.weight,
		count: plates.filter((plate) => plate === definition.weight).length
	})).filter((plate): plate is PlateCount => plate.count > 0);
}

export function calculateCurrentLoad(barWeight: BarWeight, plates: readonly PlateWeight[]): CurrentLoadSummary {
	const oneSideWeight = calculateOneSideWeight(plates);

	return {
		barWeight,
		plates,
		oneSideWeight,
		totalWeight: normalizeWeight(barWeight + oneSideWeight * 2)
	};
}

export function resolveTargetLoad(barWeight: BarWeight, requestedTotal: number): TargetLoadResult {
	if (!Number.isFinite(requestedTotal) || requestedTotal <= 0) {
		return {
			status: 'invalid',
			barWeight,
			requestedTotal,
			resolvedTotal: null,
			exact: false,
			oneSideWeight: null,
			delta: null,
			plates: [],
			message: 'Enter a positive total weight.'
		};
	}

	if (!isSupportedBarWeight(barWeight)) {
		return {
			status: 'invalid',
			barWeight,
			requestedTotal,
			resolvedTotal: null,
			exact: false,
			oneSideWeight: null,
			delta: null,
			plates: [],
			message: 'Choose either a 15 kg or 20 kg bar.'
		};
	}

	if (requestedTotal < barWeight) {
		return {
			status: 'below-bar',
			barWeight,
			requestedTotal,
			resolvedTotal: null,
			exact: false,
			oneSideWeight: null,
			delta: null,
			plates: [],
			message: 'Target weight cannot be lower than the empty bar.'
		};
	}

	const barUnits = toQuarterKiloUnits(barWeight);
	const requestedUnits = toQuarterKiloUnits(requestedTotal);
	const lowerAlignedUnits = Math.max(barUnits, alignRequestedUnits(barUnits, requestedUnits));
	const upperAlignedUnits = lowerAlignedUnits >= requestedUnits ? lowerAlignedUnits : lowerAlignedUnits + SEARCH_STEP_UNITS;

	for (let delta = 0; delta < 4000; delta += SEARCH_STEP_UNITS) {
		const lowerCandidate = lowerAlignedUnits - delta;

		if (lowerCandidate >= barUnits) {
			const lowerSideWeight = fromQuarterKiloUnits((lowerCandidate - barUnits) / 2);
			const lowerCombination = getPlateCombinationForSideWeight(lowerSideWeight);

			if (lowerCombination) {
				const resolvedTotal = fromQuarterKiloUnits(lowerCandidate);

				return {
					status: resolvedTotal === requestedTotal ? 'exact' : 'rounded',
					barWeight,
					requestedTotal,
					resolvedTotal,
					exact: resolvedTotal === requestedTotal,
					oneSideWeight: lowerSideWeight,
					delta: normalizeWeight(resolvedTotal - requestedTotal),
					plates: lowerCombination,
					message:
						resolvedTotal === requestedTotal
							? 'Exact plate loading available.'
							: `Rounded down to the nearest achievable total: ${resolvedTotal} kg.`
				};
			}
		}

		const upperCandidate = upperAlignedUnits + delta;
		const upperSideWeight = fromQuarterKiloUnits((upperCandidate - barUnits) / 2);
		const upperCombination = getPlateCombinationForSideWeight(upperSideWeight);

		if (upperCombination) {
			const resolvedTotal = fromQuarterKiloUnits(upperCandidate);

			return {
				status: resolvedTotal === requestedTotal ? 'exact' : 'rounded',
				barWeight,
				requestedTotal,
				resolvedTotal,
				exact: resolvedTotal === requestedTotal,
				oneSideWeight: upperSideWeight,
				delta: normalizeWeight(resolvedTotal - requestedTotal),
				plates: upperCombination,
				message:
					resolvedTotal === requestedTotal
						? 'Exact plate loading available.'
						: `Rounded up to the nearest achievable total: ${resolvedTotal} kg.`
			};
		}
	}

	return {
		status: 'invalid',
		barWeight,
		requestedTotal,
		resolvedTotal: null,
		exact: false,
		oneSideWeight: null,
		delta: null,
		plates: [],
		message: 'No achievable plate combination was found.'
	};
}