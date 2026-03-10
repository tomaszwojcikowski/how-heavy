import { fromQuarterKiloUnits, toQuarterKiloUnits, createPlateLookupTable } from '$lib/utils/plates';
import type { BarWeight, PlateCount, TargetLoadResult } from '$lib/types/gym';

export interface SetStep {
	id: number;
	percentage: string;
}

export interface SetTemplate {
	id: string;
	label: string;
	description: string;
	percentages?: readonly string[];
	buildSteps?: (oneRm: number, barWeight: BarWeight) => SetStep[];
}

const ROUNDED_WARMUP_FACTORS = [0.45, 0.6, 0.75] as const;
const ROUNDED_WARMUP_INCREMENT = 5;

export const SET_TEMPLATES: readonly SetTemplate[] = [
	{
		id: 'warmup-ramp',
		label: '3-step warm-up',
		description: 'Three rounded loads that are faster to build on the bar.',
		buildSteps: buildRoundedWarmupSteps
	},
	{
		id: 'top-set',
		label: 'Top-set builder',
		description: 'Ramp with smaller jumps before a heavy top set.',
		percentages: ['45', '55', '65', '75', '85', '92.5']
	}
] as const;

export function buildSetStepsFromTemplate(percentages: readonly string[]): SetStep[] {
	return percentages.map((percentage, index) => ({
		id: index + 1,
		percentage
	}));
}

function roundToNearestIncrement(value: number, increment: number): number {
	return Math.round(value / increment) * increment;
}

function formatPercentage(value: number): string {
	return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
}

export function buildRoundedWarmupSteps(oneRm: number, barWeight: BarWeight): SetStep[] {
	if (!Number.isFinite(oneRm) || oneRm <= barWeight) {
		return buildSetStepsFromTemplate(['45', '60', '75']);
	}

	let previousTotal: number = barWeight;
	const percentages = ROUNDED_WARMUP_FACTORS.map((factor) => {
		const desiredTotal = oneRm * factor;
		const roundedTotal = Math.max(
			barWeight,
			roundToNearestIncrement(desiredTotal, ROUNDED_WARMUP_INCREMENT),
			previousTotal + ROUNDED_WARMUP_INCREMENT
		);

		previousTotal = roundedTotal;
		return formatPercentage((roundedTotal / oneRm) * 100);
	});

	return buildSetStepsFromTemplate(percentages);
}

// ─── Plate lookup table (max 2 change plates per weight per side) ────────────

// Tiebreak: prefer heavier plates to keep the bar consistent across sets.
const lookupSideUnits = createPlateLookupTable({ maxChangePerSide: 2 });

// ─── Target resolution for sets ──────────────────────────────────────────────

function resolveForSets(barWeight: BarWeight, targetTotal: number): TargetLoadResult {
	if (!Number.isFinite(targetTotal) || targetTotal <= 0) {
		return {
			status: 'invalid',
			barWeight,
			requestedTotal: targetTotal,
			resolvedTotal: null,
			exact: false,
			oneSideWeight: null,
			delta: null,
			plates: [],
			message: 'Enter a positive total weight.'
		};
	}

	if (targetTotal < barWeight) {
		return {
			status: 'below-bar',
			barWeight,
			requestedTotal: targetTotal,
			resolvedTotal: null,
			exact: false,
			oneSideWeight: null,
			delta: null,
			plates: [],
			message: 'Target weight cannot be lower than the empty bar.'
		};
	}

	const barUnits = toQuarterKiloUnits(barWeight);
	const totalUnits = toQuarterKiloUnits(targetTotal);
	const baseSideUnits = Math.floor((totalUnits - barUnits) / 2);

	for (let offset = 0; offset <= 20; offset++) {
		const candidates = offset === 0 ? [baseSideUnits] : [baseSideUnits - offset, baseSideUnits + offset];

		for (const sideUnits of candidates) {
			if (sideUnits < 0) continue;
			const plates = lookupSideUnits(sideUnits);
			if (plates === null) continue;

			const achievedTotal = fromQuarterKiloUnits(barUnits + sideUnits * 2);
			const isExact = Math.abs(achievedTotal - targetTotal) < 0.01;

			return {
				status: isExact ? 'exact' : 'rounded',
				barWeight,
				requestedTotal: targetTotal,
				resolvedTotal: achievedTotal,
				exact: isExact,
				oneSideWeight: fromQuarterKiloUnits(sideUnits),
				delta: Number.parseFloat((achievedTotal - targetTotal).toFixed(2)),
				plates,
				message: isExact
					? 'Exact plate loading available.'
					: `Nearest achievable: ${achievedTotal} kg.`
			};
		}
	}

	return {
		status: 'invalid',
		barWeight,
		requestedTotal: targetTotal,
		resolvedTotal: null,
		exact: false,
		oneSideWeight: null,
		delta: null,
		plates: [],
		message: 'Cannot achieve this weight.'
	};
}

// ─── Set sequence computation ────────────────────────────────────────────────

export interface ComputedSetStep {
	id: number;
	percentage: number;
	targetTotal: number;
	result: TargetLoadResult;
	additions: PlateCount[];
	additionCost: number;
	removals: PlateCount[];
	removalCost: number;
	upWeightMoveCost: number;
	changeCost: number;
}

function diffPlates(prev: PlateCount[], next: PlateCount[]): { additions: PlateCount[]; removals: PlateCount[] } {
	const additions: PlateCount[] = [];
	const removals: PlateCount[] = [];
	const prevMap = new Map(prev.map((p) => [p.weight, p.count]));
	const nextMap = new Map(next.map((p) => [p.weight, p.count]));
	const weights = new Set([...prevMap.keys(), ...nextMap.keys()]);

	for (const weight of weights) {
		const prevCount = prevMap.get(weight) ?? 0;
		const nextCount = nextMap.get(weight) ?? 0;
		if (nextCount > prevCount) additions.push({ weight, count: nextCount - prevCount });
		if (nextCount < prevCount) removals.push({ weight, count: prevCount - nextCount });
	}

	additions.sort((a, b) => b.weight - a.weight);
	removals.sort((a, b) => b.weight - a.weight);
	return { additions, removals };
}

/**
 * Compute a set sequence by looking up each step independently in the
 * plate table (max 2 change plates per weight per side, bumpers preferred).
 *
 * Steps are sorted by ascending percentage so diffs show the minimum
 * plate changes when ramping up weight.
 */
export function computeSmartSetSequence(
	steps: SetStep[],
	barWeight: BarWeight,
	oneRm: number
): ComputedSetStep[] {
	if (!Number.isFinite(oneRm) || oneRm <= 0 || steps.length === 0) return [];

	const parsed = steps
		.map((s) => ({ id: s.id, percentage: Number.parseFloat(s.percentage) }))
		.filter((s) => Number.isFinite(s.percentage) && s.percentage > 0 && s.percentage <= 200)
		.sort((a, b) => a.percentage - b.percentage);

	if (parsed.length === 0) return [];

	const resolved = parsed.map((s) => {
		const targetTotal = Math.round(((oneRm * s.percentage) / 100) * 4) / 4;
		return { ...s, targetTotal, result: resolveForSets(barWeight, targetTotal) };
	});

	const MAX_TRANSITION_MOVES = 10;

	return resolved.map((s, i) => {
		const prevPlates = i === 0 ? [] : (resolved[i - 1].result.plates ?? []);
		const currPlates = s.result.plates ?? [];
		let { additions, removals } =
			i === 0
				? { additions: currPlates, removals: [] as PlateCount[] }
				: diffPlates(prevPlates, currPlates);

		const diffCost = (additions.reduce((sum, p) => sum + p.count, 0) + removals.reduce((sum, p) => sum + p.count, 0)) * 2;

		// If the transition costs more than loading from scratch, treat as a fresh load.
		if (i > 0 && diffCost > MAX_TRANSITION_MOVES) {
			additions = currPlates;
			removals = [];
		}

		const additionCost = additions.reduce((sum, p) => sum + p.count, 0) * 2;
		const removalCost = removals.reduce((sum, p) => sum + p.count, 0) * 2;
		const changeCost = additionCost + removalCost;
		const prevTotal = i === 0 ? barWeight : resolved[i - 1].targetTotal;
		const upWeightMoveCost = s.targetTotal > prevTotal ? changeCost : 0;

		return {
			id: s.id,
			percentage: s.percentage,
			targetTotal: s.targetTotal,
			result: s.result,
			additions,
			additionCost,
			removals,
			removalCost,
			upWeightMoveCost,
			changeCost
		};
	});
}
