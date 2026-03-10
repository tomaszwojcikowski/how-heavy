import { browser } from '$app/environment';

import type { BarWeight } from '$lib/types/gym';

let themeTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

export function applyBarTheme(barWeight: BarWeight): void {
	if (!browser) {
		return;
	}

	const root = document.documentElement;
	const nextTheme = String(barWeight);
	const previousTheme = root.dataset.barTheme;

	if (previousTheme === nextTheme) {
		return;
	}

	root.dataset.barTheme = nextTheme;
	root.classList.remove('theme-transitioning');
	void root.offsetWidth;
	root.classList.add('theme-transitioning');

	if (themeTransitionTimeout) {
		clearTimeout(themeTransitionTimeout);
	}

	themeTransitionTimeout = setTimeout(() => {
		root.classList.remove('theme-transitioning');
		themeTransitionTimeout = null;
	}, 420);
}