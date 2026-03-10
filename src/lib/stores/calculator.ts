import { get, set } from 'idb-keyval';

import type { BarWeight, PlateWeight } from '$lib/types/gym';

const STORAGE_KEY = 'how-heavy:calculator-state';

interface PersistedCalculatorState {
	target: {
		barWeight: BarWeight;
		value: string;
	};
	current: {
		barWeight: BarWeight;
		plates: PlateWeight[];
	};
}

const DEFAULT_STATE: PersistedCalculatorState = {
	target: {
		barWeight: 20,
		value: '100'
	},
	current: {
		barWeight: 20,
		plates: []
	}
};

export async function loadCalculatorState(): Promise<PersistedCalculatorState> {
	const stored = await get<PersistedCalculatorState>(STORAGE_KEY);

	return {
		...DEFAULT_STATE,
		...stored,
		target: {
			...DEFAULT_STATE.target,
			...stored?.target
		},
		current: {
			...DEFAULT_STATE.current,
			...stored?.current
		}
	};
}

export async function saveTargetState(target: PersistedCalculatorState['target']): Promise<void> {
	const currentState = await loadCalculatorState();
	await set(STORAGE_KEY, {
		...currentState,
		target
	});
}

export async function saveCurrentState(current: PersistedCalculatorState['current']): Promise<void> {
	const currentState = await loadCalculatorState();
	await set(STORAGE_KEY, {
		...currentState,
		current
	});
}