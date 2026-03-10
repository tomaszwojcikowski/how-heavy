import { PLATE_DEFINITIONS, fromQuarterKiloUnits, isSupportedBarWeight, toQuarterKiloUnits, createPlateLookupTable } from '$lib/utils/plates';
import type { BarWeight, CurrentLoadSummary, PlateCount, PlateWeight, TargetLoadResult } from '$lib/types/gym';

const SEARCH_STEP_UNITS = 2;

// Tiebreaker: prefer 15 kg, 10 kg before 20 kg.
// PLATE_DEFINITIONS: [20=0, 15=1, 10=2, 5=3, 2.5=4, 2=5, 1.5=6, 1.25=7, 1=8, 0.5=9]
const lookupSideUnits = createPlateLookupTable({
	maxChangePerSide: 4,
	tiebreakOrder: [1, 2, 0, 3, 4, 5, 6, 7, 8, 9],
	penalizeCrowdedStacks: true
});

function normalizeWeight(value: number): number {
	return Number.parseFloat(value.toFixed(2));
}

function alignRequestedUnits(barUnits: number, targetUnits: number): number {
	const parityOffset = (targetUnits - barUnits) % SEARCH_STEP_UNITS;
	return parityOffset === 0 ? targetUnits : targetUnits - parityOffset;
}

function getPlateCombinationForTotalUnits(barUnits: number, totalUnits: number): PlateCount[] | null {
	if (totalUnits < barUnits || (totalUnits - barUnits) % 2 !== 0) {
		return null;
	}
	return lookupSideUnits((totalUnits - barUnits) / 2);
}

export function getPlateCombinationForSideWeight(sideWeight: number): PlateCount[] | null {
	if (!Number.isFinite(sideWeight) || sideWeight < 0) return null;
	return lookupSideUnits(toQuarterKiloUnits(sideWeight));
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
			message: 'Choose either 15 kg or 20 kg.'
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
			const lowerCombination = getPlateCombinationForTotalUnits(barUnits, lowerCandidate);

			if (lowerCombination) {
				const lowerSideWeight = fromQuarterKiloUnits((lowerCandidate - barUnits) / 2);
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
		const upperCombination = getPlateCombinationForTotalUnits(barUnits, upperCandidate);

		if (upperCombination) {
			const upperSideWeight = fromQuarterKiloUnits((upperCandidate - barUnits) / 2);
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