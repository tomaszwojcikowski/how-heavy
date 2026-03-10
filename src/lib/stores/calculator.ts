import { browser } from '$app/environment';
import { get, set } from 'idb-keyval';

import type { BarWeight, PlateWeight } from '$lib/types/gym';

const STORAGE_KEY = 'how-heavy:calculator-state';
const THEME_STORAGE_KEY = 'how-heavy:preferred-bar-weight';

interface PersistedCalculatorState {
	preferences: {
		preferredBarWeight: BarWeight;
	};
	target: {
		barWeight: BarWeight;
		value: string;
	};
	current: {
		barWeight: BarWeight;
		plates: PlateWeight[];
	};
	sets: {
		barWeight: BarWeight;
		oneRm: string;
	};
}

type CalculatorStatePatch = {
	preferences?: Partial<PersistedCalculatorState['preferences']>;
	target?: Partial<PersistedCalculatorState['target']>;
	current?: Partial<PersistedCalculatorState['current']>;
	sets?: Partial<PersistedCalculatorState['sets']>;
};

const DEFAULT_STATE: PersistedCalculatorState = {
	preferences: {
		preferredBarWeight: 20
	},
	target: {
		barWeight: 20,
		value: '100'
	},
	current: {
		barWeight: 20,
		plates: []
	},
	sets: {
		barWeight: 20,
		oneRm: '100'
	}
};

function normalizeStoredState(stored?: Partial<PersistedCalculatorState>): PersistedCalculatorState {
	const preferredBarWeight =
		stored?.preferences?.preferredBarWeight ??
		stored?.sets?.barWeight ??
		stored?.target?.barWeight ??
		stored?.current?.barWeight ??
		DEFAULT_STATE.preferences.preferredBarWeight;

	return {
		preferences: {
			preferredBarWeight
		},
		target: {
			...DEFAULT_STATE.target,
			...stored?.target,
			barWeight: stored?.target?.barWeight ?? preferredBarWeight
		},
		current: {
			...DEFAULT_STATE.current,
			...stored?.current,
			barWeight: stored?.current?.barWeight ?? preferredBarWeight
		},
		sets: {
			...DEFAULT_STATE.sets,
			...stored?.sets,
			barWeight: stored?.sets?.barWeight ?? preferredBarWeight
		}
	};
}

export async function loadCalculatorState(): Promise<PersistedCalculatorState> {
	const stored = await get<PersistedCalculatorState>(STORAGE_KEY);

	return normalizeStoredState(stored);
}

export async function patchCalculatorState(patch: CalculatorStatePatch): Promise<void> {
	const currentState = await loadCalculatorState();
	const nextPreferredBarWeight = patch.preferences?.preferredBarWeight ?? currentState.preferences.preferredBarWeight;

	if (browser && typeof window.localStorage !== 'undefined') {
		window.localStorage.setItem(THEME_STORAGE_KEY, String(nextPreferredBarWeight));
	}

	await set(STORAGE_KEY, {
		preferences: {
			...currentState.preferences,
			...patch.preferences
		},
		target: {
			...currentState.target,
			...patch.target
		},
		current: {
			...currentState.current,
			...patch.current
		},
		sets: {
			...currentState.sets,
			...patch.sets
		}
	});
}

export async function savePreferredBarWeight(preferredBarWeight: BarWeight): Promise<void> {
	await patchCalculatorState({
		preferences: { preferredBarWeight }
	});
}

export async function saveTargetState(target: PersistedCalculatorState['target']): Promise<void> {
	await patchCalculatorState({
		preferences: {
			preferredBarWeight: target.barWeight
		},
		target
	});
}

export async function saveCurrentState(current: PersistedCalculatorState['current']): Promise<void> {
	await patchCalculatorState({
		preferences: {
			preferredBarWeight: current.barWeight
		},
		current
	});
}

export async function saveSetsState(sets: PersistedCalculatorState['sets']): Promise<void> {
	await patchCalculatorState({
		preferences: {
			preferredBarWeight: sets.barWeight
		},
		sets
	});
}