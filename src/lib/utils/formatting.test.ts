import { describe, expect, it } from 'vitest';

import { formatWeight } from './formatting';

describe('formatWeight', () => {
	it('formats integer weights without decimals', () => {
		expect(formatWeight(20)).toBe('20 kg');
	});

	it('formats fractional weights without trailing zero noise', () => {
		expect(formatWeight(1.5)).toBe('1.5 kg');
		expect(formatWeight(1.25)).toBe('1.25 kg');
	});

	it('returns placeholders for missing values', () => {
		expect(formatWeight(null)).toBe('--');
		expect(formatWeight(undefined)).toBe('--');
	});
});