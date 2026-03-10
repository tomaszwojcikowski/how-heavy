import { PLATE_DEFINITIONS, fromQuarterKiloUnits, toQuarterKiloUnits } from '$lib/utils/plates';
import { resolveTargetLoad } from '$lib/utils/calculations';
import type { BarWeight, PlateCount, PlateWeight, TargetLoadResult } from '$lib/types/gym';

export interface SetStep {
	id: number;
	percentage: string;
}

export interface ComputedSetStep {
	id: number;
	percentage: number;
	targetTotal: number;
	result: TargetLoadResult;
	/** Plates to add vs the previous step (ascending order) */
	additions: PlateCount[];
	/** Plates to remove vs the previous step (ascending order) */
	removals: PlateCount[];
	/** Total number of individual plate moves (adds + removes) */
	changeCost: number;
}

/**
 * Given a constraint of available plates from the heavier step, find the best
 * subset combination (bounded knapsack) whose total side‑weight comes as close
 * as possible to `targetSideWeight` without exceeding it.
 */
function findSubsetCombo(targetSideWeight: number, constraintPlates: PlateCount[]): PlateCount[] {
	const targetUnits = toQuarterKiloUnits(targetSideWeight);

	// Build a flat list of available (weight, units) pairs sorted heaviest first
	const available = constraintPlates
		.filter((p) => p.count > 0)
		.map((p) => ({ weight: p.weight, count: p.count, units: toQuarterKiloUnits(p.weight) }))
		.sort((a, b) => b.units - a.units);

	if (targetUnits === 0 || available.length === 0) return [];

	// DP: dp[u] = best PlateCount[] whose unit sum === u, or null
	const dp: Array<Array<{ weight: PlateWeight; count: number }> | null> = Array.from(
		{ length: targetUnits + 1 },
		() => null
	);
	dp[0] = [];

	for (const { weight, count, units } of available) {
		// Iterate top-down inside each plate type (bounded knapsack)
		for (let u = targetUnits; u >= units; u--) {
			for (let k = 1; k <= count && k * units <= u; k++) {
				const prev = dp[u - k * units];
				if (prev === null) continue;
				if (dp[u] === null) {
					dp[u] = [...prev, { weight, count: k }];
				}
				// Prefer the combination that fills the target more exactly — already handled
				// by iterating from highest to lowest and only setting when null
			}
		}
	}

	// Find the closest achievable value ≤ targetSideWeight
	for (let u = targetUnits; u >= 0; u--) {
		if (dp[u] !== null) {
			// Merge entries for duplicate weights that may have been appended
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

	// Collect all weights mentioned in either step
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
 * Core smart‑sequence algorithm.
 *
 * Steps:
 * 1. Sort the user's percentages ascending.
 * 2. Resolve the *heaviest* step with the standard unconstrained algorithm.
 * 3. For each lighter step (working downward), find the best subset of the
 *    immediately heavier step's plates that comes closest to the target weight.
 *    This guarantees you only ever ADD plates going upward.
 * 4. If the subset route deviates too far (>5 kg per side), fall back to the
 *    unconstrained algorithm and accept the extra racking moves.
 */
export function computeSmartSetSequence(
	steps: SetStep[],
	barWeight: BarWeight,
	oneRm: number
): ComputedSetStep[] {
	if (!Number.isFinite(oneRm) || oneRm <= 0 || steps.length === 0) return [];

	// Map to sorted (percentage, id) pairs
	const parsed = steps
		.map((s) => ({ id: s.id, percentage: Number.parseFloat(s.percentage) }))
		.filter((s) => Number.isFinite(s.percentage) && s.percentage > 0 && s.percentage <= 200)
		.sort((a, b) => a.percentage - b.percentage);

	if (parsed.length === 0) return [];

	// Resolve all unconstrained results first (used as reference + fallback)
	const unconstrained: TargetLoadResult[] = parsed.map((s) =>
		resolveTargetLoad(barWeight, Math.round((oneRm * s.percentage) / 100 * 4) / 4)
	);

	// Build constrained results from heaviest → lightest
	const results: TargetLoadResult[] = new Array(parsed.length);
	results[parsed.length - 1] = unconstrained[parsed.length - 1];

	for (let i = parsed.length - 2; i >= 0; i--) {
		const heavierPlates = results[i + 1].plates;
		const targetTotal = Math.round((oneRm * parsed[i].percentage) / 100 * 4) / 4;
		const targetSideWeight = (targetTotal - barWeight) / 2;

		if (heavierPlates.length === 0 || targetSideWeight <= 0) {
			results[i] = unconstrained[i];
			continue;
		}

		const subsetCombo = findSubsetCombo(targetSideWeight, heavierPlates);
		const subsetSideTotal = subsetCombo.reduce((s, p) => s + p.weight * p.count, 0);
		const subsetTotal = fromQuarterKiloUnits(toQuarterKiloUnits(barWeight + subsetSideTotal * 2));

		// Accept the subset if deviation per side ≤ 5 kg — otherwise use unconstrained
		if (Math.abs(subsetSideTotal - targetSideWeight) <= 5) {
			results[i] = {
				...unconstrained[i],
				plates: subsetCombo,
				resolvedTotal: subsetTotal,
				oneSideWeight: subsetSideTotal,
				delta: Number.parseFloat((subsetTotal - targetTotal).toFixed(2)),
				status: subsetTotal === targetTotal ? 'exact' : 'rounded',
				exact: subsetTotal === targetTotal,
				message:
					subsetTotal === targetTotal
						? 'Exact plate loading available.'
						: `Rounded to ${subsetTotal} kg (subset of heavier step).`
			};
		} else {
			results[i] = unconstrained[i];
		}
	}

	// Compute diffs between consecutive steps
	return parsed.map((s, i) => {
		const { additions, removals } = i === 0
			? { additions: results[i].plates, removals: [] }
			: diffPlates(results[i - 1].plates, results[i].plates);

		const changeCost =
			additions.reduce((sum, p) => sum + p.count, 0) +
			removals.reduce((sum, p) => sum + p.count, 0);

		return {
			id: s.id,
			percentage: s.percentage,
			targetTotal: Math.round((oneRm * s.percentage) / 100 * 4) / 4,
			result: results[i],
			additions,
			removals,
			changeCost
		};
	});
}
