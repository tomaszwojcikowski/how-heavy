<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { triggerHaptic } from '$lib/utils/haptics';

	export let open = false;
	export let value = '0';
	export let label = 'Enter value';
	export let onSubmit: (val: string) => void;
	export let onClose: () => void;

	let internalValue = value;

	$: if (open) {
		internalValue = value;
	}

	function handlePad(char: string) {
		triggerHaptic();
		if (internalValue === '0' && char !== '.') {
			internalValue = char;
		} else {
			// prevent multiple decimals
			if (char === '.' && internalValue.includes('.')) return;
			// Limit to a reasonable length
			if (internalValue.length >= 6) return;
			internalValue += char;
		}
	}

	function handleBackspace() {
		triggerHaptic();
		internalValue = internalValue.slice(0, -1);
		if (internalValue === '') {
			internalValue = '0';
		}
	}

	function handleConfirm() {
		triggerHaptic(15);
		let finalVal = internalValue.endsWith('.') ? internalValue.slice(0, -1) : internalValue;
		if (finalVal === '') finalVal = '0';

		onSubmit(finalVal);
		onClose();
	}
</script>

{#if open}
	<div class="pad-overlay" transition:fade={{duration: 150}} onclick={onClose} aria-hidden="true"></div>

	<div
		class="pad-sheet"
		transition:fly={{ y: '100%', duration: 300, easing: cubicOut }}
	>
		<div class="pad-header">
			<span class="pad-label">{label}</span>
			<strong class="pad-display weight-display">{internalValue}</strong>
		</div>

		<div class="pad-grid">
			{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'] as char}
				<button type="button" class="pad-btn" onclick={() => handlePad(char)}>{char}</button>
			{/each}
			<button type="button" class="pad-btn" onclick={handleBackspace} aria-label="Backspace">
				<span class="material-symbols-rounded">backspace</span>
			</button>
		</div>

		<div class="pad-actions">
			<md-text-button onclick={onClose}>Cancel</md-text-button>
			<md-filled-button onclick={handleConfirm}>Confirm</md-filled-button>
		</div>
	</div>
{/if}

<style>
	.pad-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 100;
	}

	.pad-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--md-sys-color-surface-container-low);
		border-radius: 24px 24px 0 0;
		padding: 1.5rem 1.5rem 2rem;
		box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
		z-index: 101;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		touch-action: none;
		max-width: 600px;
		margin: 0 auto;
	}

	.pad-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.pad-label {
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.pad-display {
		font-size: 3.5rem;
		line-height: 1;
	}

	.pad-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		max-width: 400px;
		margin: 0 auto;
		width: 100%;
	}

	.pad-btn {
		background: var(--md-sys-color-surface-container-highest);
		color: var(--text-primary);
		border: none;
		border-radius: 12px;
		font-size: 1.75rem;
		font-family: 'Archivo', sans-serif;
		font-weight: 700;
		padding: 1.25rem 0;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition: background 150ms ease, transform 100ms ease;
		-webkit-tap-highlight-color: transparent;
	}

	.pad-btn:active {
		background: var(--md-sys-color-primary-container);
		transform: scale(0.96);
	}

	.pad-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		max-width: 400px;
		margin: 0 auto;
		width: 100%;
	}

    @media (prefers-color-scheme: dark) {
        .pad-overlay {
            background: rgba(0, 0, 0, 0.6);
        }
    }
</style>
