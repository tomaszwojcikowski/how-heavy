import { describe, expect, it } from 'vitest';

import { appName, featureHighlights, tagline } from './site';

describe('site metadata', () => {
	it('keeps the current branding', () => {
		expect(appName).toBe('How Heavy');
		expect(tagline).toContain('15 kg');
	});

	it('includes the three home page highlight messages', () => {
		expect(featureHighlights).toHaveLength(3);
		expect(featureHighlights[2]).toContain('plate graphics');
	});
});