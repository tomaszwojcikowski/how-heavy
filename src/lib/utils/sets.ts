import { getPlateCombinationForSideWeight, resolveTargetLoad } from '$lib/utils/calculations';
import { getMaxPlateCountPerSide, PLATE_MAP, fromQuarterKiloUnits, toQuarterKiloUnits } from '$lib/utils/plates';
import type { BarWeight, PlateCount, PlateWeight, TargetLoadResult } from '$lib/types/gym';

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

export interface ComputedSetStep {
	id: number;
	percentage: number;
	targetTotal: number;
	result: TargetLoadResult;
	/** Plates to add vs the previous step (heaviest first) */
	additions: PlateCount[];
	/** Number of individual plate additions required across the whole bar */
	additionCost: number;
	/** Plates to remove vs the previous step (heaviest first) */
	removals: PlateCount[];
	/** Number of individual plate removals required across the whole bar */
	removalCost: number;
	/** Total number of whole-bar moves required when this step increases the load */
	upWeightMoveCost: number;
	/** Total number of individual plate moves across the whole bar (adds + removes) */
	changeCost: number;
}

interface SequenceState {
	result: TargetLoadResult;
	totalCost: number;
	path: TargetLoadResult[];
}

function mergePlates(a: PlateCount[], b: PlateCount[]): PlateCount[] {
	const map = new Map<PlateWeight, number>();
	for (const { weight, count } of [...a, ...b]) {
		map.set(weight, (map.get(weight) ?? 0) + count);
	}
	return Array.from(map.entries())
		.map(([weight, count]) => ({ weight, count }))
		.sort((a, b) => b.weight - a.weight);
}

function plateSignature(plates: PlateCount[]): string {
	return plates.map((plate) => `${plate.weight}:${plate.count}`).join('|');
}

function resultSignature(result: TargetLoadResult): string {
	return `${result.status}:${result.resolvedTotal ?? result.requestedTotal}:${plateSignature(result.plates)}`;
}

/**
 * Find the minimum plate combination for `delta` kg per side.
 * If the exact delta isn't achievable (e.g. 0.75 kg with 0.5 kg minimum plate),
 * round up in 0.25 kg increments until achievable (max +1 kg overshoot).
 */
function addPlatesForDelta(delta: number): PlateCount[] | null {
	for (let bump = 0; bump <= 4; bump++) {
		const adjusted = fromQuarterKiloUnits(toQuarterKiloUnits(delta) + bump);
		const combo = getPlateCombinationForSideWeight(adjusted);
		if (combo !== null) return combo;
	}
	return null;
}

/** True for bumper plates (5 kg+) — these are kept on the bar between sets. */
function isBumperPlate(weight: PlateWeight): boolean {
	return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP]?.kind === 'bumper';
}

/**
 * Build a result keeping all bumper plates from `lockedBumpers` in place and
 * computing a fresh small-plate combination for the remaining side weight.
 * Returns null when the remaining weight isn't achievable.
 */
function buildResultLockingBumpers(
	barWeight: BarWeight,
	targetTotal: number,
	targetSideWeight: number,
	lockedBumpers: PlateCount[]
): TargetLoadResult | null {
	const bumperWeight = lockedBumpers.reduce((s, p) => s + p.weight * p.count, 0);
	const remaining = Number.parseFloat((targetSideWeight - bumperWeight).toFixed(4));
	if (remaining < 0) return null;
	const remainderCombo = remaining > 0.001 ? getPlateCombinationForSideWeight(remaining) : [];
	if (remainderCombo === null) return null;
	return makeResult(barWeight, targetTotal, mergePlates(lockedBumpers, remainderCombo));
}

/**
 * Find the best subset of `constraintPlates` whose total ≤ targetSideWeight,
 * choosing the combination closest to target (bounded knapsack).
 * Used when a step is lighter than the previous (e.g. descending percentages).
 */
function findSubsetCombo(targetSideWeight: number, constraintPlates: PlateCount[]): PlateCount[] {
	const targetUnits = toQuarterKiloUnits(targetSideWeight);
	const available = constraintPlates
		.filter((p) => p.count > 0)
		.map((p) => ({ weight: p.weight as PlateWeight, count: p.count, units: toQuarterKiloUnits(p.weight) }))
		.sort((a, b) => b.units - a.units);

	if (targetUnits === 0 || available.length === 0) return [];

	const dp: Array<Array<{ weight: PlateWeight; count: number }> | null> = Array.from(
		{ length: targetUnits + 1 },
		() => null
	);
	dp[0] = [];

	for (const { weight, count, units } of available) {
		for (let u = targetUnits; u >= units; u--) {
			for (let k = 1; k <= count && k * units <= u; k++) {
				const prev = dp[u - k * units];
				if (prev === null) continue;
				if (dp[u] === null) dp[u] = [...prev, { weight, count: k }];
			}
		}
	}

	for (let u = targetUnits; u >= 0; u--) {
		if (dp[u] !== null) {
			const merged = new Map<PlateWeight, number>();
			for (const { weight, count } of dp[u]!) {
				merged.set(weight, (merged.get(weight) ?? 0) + count);
			}
			return Array.from(merged.entries())
				.map(([w, c]) => ({ weight: w, count: c }))
				.sort((a, b) => b.weight - a.weight);
		}
	}
	return [];
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
 * Consolidate only the EXCESS change plates beyond the allowed per-side cap.
 * This keeps up to 4 identical small plates on the full bar (2 per side) before
 * folding extra pairs into larger equivalents.
 */
function consolidatePlates(plates: PlateCount[]): PlateCount[] {
	const map = new Map<number, number>(plates.map((p) => [p.weight, p.count]));
	const rules: [number, number][] = [[1.25, 2.5], [2.5, 5]];
	let changed = true;
	while (changed) {
		changed = false;
		for (const [from, to] of rules) {
			const n = map.get(from) ?? 0;
			const maxCount = getMaxPlateCountPerSide(from as PlateWeight);
			const excess = Number.isFinite(maxCount) ? Math.max(0, n - maxCount) : 0;
			const pairs = Math.ceil(excess / 2);
			if (pairs === 0) continue;
			map.set(from, n - pairs * 2);
			if ((map.get(from) ?? 0) === 0) map.delete(from);
			map.set(to, (map.get(to) ?? 0) + pairs);
			changed = true;
		}
	}
	return Array.from(map.entries())
		.map(([weight, count]) => ({ weight: weight as PlateWeight, count }))
		.sort((a, b) => b.weight - a.weight);
}

/** Total whole-bar plate-move cost (adds + removals on both sides) between two bar states. */
function moveCost(prev: PlateCount[], next: PlateCount[]): number {
	const { additions, removals } = diffPlates(prev, next);
	return (additions.reduce((s, p) => s + p.count, 0) + removals.reduce((s, p) => s + p.count, 0)) * 2;
}

/** Build a TargetLoadResult from a concrete plate list (total weight already known to be achievable). */
function makeResult(barWeight: BarWeight, requestedTotal: number, plates: PlateCount[]): TargetLoadResult {
	const achievedSide = Number.parseFloat(plates.reduce((s, p) => s + p.weight * p.count, 0).toFixed(4));
	const achievedTotal = fromQuarterKiloUnits(toQuarterKiloUnits(barWeight + achievedSide * 2));
	const isExact = Math.abs(achievedTotal - requestedTotal) < 0.01;
	return {
		status: isExact ? 'exact' : 'rounded',
		barWeight,
		requestedTotal,
		resolvedTotal: achievedTotal,
		exact: isExact,
		oneSideWeight: achievedSide,
		delta: Number.parseFloat((achievedTotal - requestedTotal).toFixed(2)),
		plates,
		message: isExact ? 'Exact plate loading available.' : `Nearest achievable: ${achievedTotal} kg.`
	};
}

function dedupeResults(results: Array<TargetLoadResult | null | undefined>): TargetLoadResult[] {
	const deduped = new Map<string, TargetLoadResult>();

	for (const result of results) {
		if (!result) {
			continue;
		}

		deduped.set(resultSignature(result), result);
	}

	return Array.from(deduped.values());
}

function buildStepCandidates(
	prev: TargetLoadResult | null,
	barWeight: BarWeight,
	targetTotal: number,
	targetSideWeight: number
): TargetLoadResult[] {
	if (prev === null || prev.status === 'invalid' || prev.status === 'below-bar' || targetSideWeight <= 0) {
		return [resolveTargetLoad(barWeight, targetTotal)];
	}

	const prevSideWeight = prev.oneSideWeight ?? 0;
	const delta = Number.parseFloat((targetSideWeight - prevSideWeight).toFixed(4));

	if (Math.abs(delta) < 0.01) {
		return [{ ...prev, requestedTotal: targetTotal }];
	}

	const unconstrained = resolveTargetLoad(barWeight, targetTotal);

	if (delta > 0.01) {
		const deltaPlates = addPlatesForDelta(delta);
		const candidateA = deltaPlates !== null
			? makeResult(barWeight, targetTotal, consolidatePlates(mergePlates(prev.plates, deltaPlates)))
			: null;

		const prevBumpers = prev.plates.filter((p) => isBumperPlate(p.weight));
		const candidateB = buildResultLockingBumpers(barWeight, targetTotal, targetSideWeight, prevBumpers);

		return dedupeResults([candidateA, candidateB, unconstrained]);
	}

	const prevBumpers = prev.plates.filter((p) => isBumperPlate(p.weight));
	const bumperWeight = prevBumpers.reduce((s, p) => s + p.weight * p.count, 0);
	const candidateKeepBumpers = targetSideWeight >= bumperWeight
		? makeResult(
				barWeight,
				targetTotal,
				consolidatePlates(
					mergePlates(
						prevBumpers,
						(targetSideWeight - bumperWeight) > 0.001
							? findSubsetCombo(Number.parseFloat((targetSideWeight - bumperWeight).toFixed(4)), prev.plates.filter((p) => !isBumperPlate(p.weight)))
							: []
					)
				)
			)
		: null;

	const candidateSubset = makeResult(barWeight, targetTotal, consolidatePlates(findSubsetCombo(targetSideWeight, prev.plates)));

	return dedupeResults([candidateKeepBumpers, candidateSubset, unconstrained]);
}

/**
 * Smart set-sequence algorithm — ascending build strategy.
 *
 * Processes steps lightest → heaviest. Each heavier step is built by ADDING
 * the minimum plates to the previous step's bar. This guarantees you never
 * remove a heavy plate to load the next set — you just stack more on top.
 *
 * If a delta can't be hit exactly (e.g. 0.75 kg against a 0.5 kg minimum plate),
 * the delta is rounded up by up to 1 kg/side to find the nearest achievable weight.
 *
 * If steps go downward in weight (unusual but valid), the algorithm removes the
 * smallest plates first, preserving heavy plates already on the bar.
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

	let states: SequenceState[] = [];

	for (let i = 0; i < parsed.length; i++) {
		const targetTotal = Math.round(((oneRm * parsed[i].percentage) / 100) * 4) / 4;
		const targetSideWeight = (targetTotal - barWeight) / 2;

		if (i === 0) {
			const firstResult = resolveTargetLoad(barWeight, targetTotal);
			states = [{
				result: firstResult,
				totalCost: moveCost([], firstResult.plates),
				path: [firstResult]
			}];
			continue;
		}

		const nextStates = new Map<string, SequenceState>();

		for (const state of states) {
			const candidates = buildStepCandidates(state.result, barWeight, targetTotal, targetSideWeight);

			for (const candidate of candidates) {
				const signature = resultSignature(candidate);
				const totalCost = state.totalCost + moveCost(state.result.plates, candidate.plates);
				const existing = nextStates.get(signature);

				if (
					!existing ||
					totalCost < existing.totalCost ||
					(totalCost === existing.totalCost && candidate.plates.reduce((sum, plate) => sum + plate.count, 0) < existing.result.plates.reduce((sum, plate) => sum + plate.count, 0))
				) {
					nextStates.set(signature, {
						result: candidate,
						totalCost,
						path: [...state.path, candidate]
					});
				}
			}
		}

		states = Array.from(nextStates.values());
	}

	const bestState = states.reduce((best, state) => {
		if (!best) {
			return state;
		}

		const bestPlateCount = best.result.plates.reduce((sum, plate) => sum + plate.count, 0);
		const statePlateCount = state.result.plates.reduce((sum, plate) => sum + plate.count, 0);

		if (state.totalCost !== best.totalCost) {
			return state.totalCost < best.totalCost ? state : best;
		}

		return statePlateCount < bestPlateCount ? state : best;
	}, null as SequenceState | null);

	const results = bestState?.path ?? [];

	// Compute diffs
	return parsed.map((s, i) => {
		const { additions, removals } =
			i === 0
				? { additions: results[i].plates ?? [], removals: [] }
				: diffPlates(results[i - 1].plates, results[i].plates);
		const additionCost = additions.reduce((sum, p) => sum + p.count, 0) * 2;
		const removalCost = removals.reduce((sum, p) => sum + p.count, 0) * 2;
		const changeCost = additionCost + removalCost;
		const previousResolvedTotal = i === 0
			? barWeight
			: (results[i - 1].resolvedTotal ?? results[i - 1].requestedTotal);
		const currentResolvedTotal = results[i].resolvedTotal ?? results[i].requestedTotal;
		const upWeightMoveCost = currentResolvedTotal > previousResolvedTotal ? changeCost : 0;
		return {
			id: s.id,
			percentage: s.percentage,
			targetTotal: Math.round(((oneRm * s.percentage) / 100) * 4) / 4,
			result: results[i],
			additions,
			additionCost,
			removals,
			removalCost,
			upWeightMoveCost,
			changeCost
		};
	});
}



