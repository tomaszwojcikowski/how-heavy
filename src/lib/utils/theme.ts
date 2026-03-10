import { browser } from '$app/environment';

import type { BarWeight } from '$lib/types/gym';

export function applyBarTheme(barWeight: BarWeight): void {
	if (!browser) {
		return;
	}

	document.documentElement.dataset.barTheme = String(barWeight);
}