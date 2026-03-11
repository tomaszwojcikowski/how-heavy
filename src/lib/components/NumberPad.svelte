<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { triggerHaptic } from '$lib/utils/haptics';

	export let open = false;
	export let value = '0';
	export let label = 'Enter value';
	export let onSubmit: (val: string) => void;
	export let onClose: () => void;

	const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'] as const;
	const SWIPE_CLOSE_THRESHOLD = 120;

	let internalValue = value;
	let previewKey = '';
	let previewTimeout: ReturnType<typeof setTimeout> | null = null;
	let dragStartY = 0;
	let dragOffset = 0;
	let dragging = false;
	let activePointerId: number | null = null;
	let sheetElement: HTMLDivElement | null = null;

	function portal(node: HTMLDivElement) {
		document.body.appendChild(node);

		return {
			destroy() {
				node.remove();
			}
		};
	}

	$: if (open) {
		internalValue = value;
		dragOffset = 0;
		dragging = false;
	}

	function clearPreview() {
		previewKey = '';

		if (previewTimeout) {
			clearTimeout(previewTimeout);
			previewTimeout = null;
		}
	}

	function showPreview(key: string) {
		previewKey = key;

		if (previewTimeout) {
			clearTimeout(previewTimeout);
		}

		previewTimeout = setTimeout(() => {
			previewKey = '';
			previewTimeout = null;
		}, 140);
	}

	function closePad() {
		dragOffset = 0;
		dragging = false;
		activePointerId = null;
		clearPreview();
		onClose();
	}

	function handlePad(char: string) {
		triggerHaptic();
		showPreview(char);
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
		showPreview('⌫');
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
		closePad();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') {
			return;
		}

		event.preventDefault();
		closePad();
	}

	function handleDragStart(event: PointerEvent) {
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}

		dragging = true;
		activePointerId = event.pointerId;
		dragStartY = event.clientY;
		sheetElement?.setPointerCapture(event.pointerId);
	}

	function handleDragMove(event: PointerEvent) {
		if (!dragging || activePointerId !== event.pointerId) {
			return;
		}

		dragOffset = Math.max(0, event.clientY - dragStartY);
	}

	function endDrag(event?: PointerEvent) {
		if (event && activePointerId !== event.pointerId) {
			return;
		}

		if (!dragging) {
			return;
		}

		if (dragOffset >= SWIPE_CLOSE_THRESHOLD) {
			triggerHaptic(15);
			closePad();
			return;
		}

		dragging = false;
		activePointerId = null;
		dragOffset = 0;
	}

	onDestroy(() => {
		clearPreview();
	}
	);
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open}
	<div class="pad-portal" use:portal>
		<div class="pad-overlay" transition:fade={{ duration: 160 }} onclick={closePad} aria-hidden="true"></div>

		<div
			bind:this={sheetElement}
			class="pad-sheet"
			class:pad-sheet--dragging={dragging}
			style:transform={`translateY(${dragOffset}px)`}
			role="dialog"
			aria-modal="true"
			aria-label={label}
		>
			<button
				type="button"
				class="pad-handle"
				onpointerdown={handleDragStart}
				onpointermove={handleDragMove}
				onpointerup={endDrag}
				onpointercancel={endDrag}
				aria-label="Swipe down to close keypad"
			>
				<span class="pad-handle__bar" aria-hidden="true"></span>
			</button>

			<div class="pad-header">
				<span class="pad-label">{label}</span>
				<strong class="pad-display weight-display">{internalValue}</strong>
			</div>

			<div class="pad-grid">
				{#each PAD_KEYS as char (char)}
					<button type="button" class="pad-btn" onclick={() => handlePad(char)}>
						<span class:pad-preview--visible={previewKey === char} class="pad-preview" aria-hidden="true">
							{char}
						</span>
						<span>{char}</span>
					</button>
				{/each}
				<button type="button" class="pad-btn" onclick={handleBackspace} aria-label="Backspace">
					<span class:pad-preview--visible={previewKey === '⌫'} class="pad-preview" aria-hidden="true">
						⌫
					</span>
					<span class="material-symbols-rounded">backspace</span>
				</button>
			</div>

			<div class="pad-actions">
				<button type="button" class="pad-action pad-action--secondary" onclick={closePad}>Cancel</button>
				<button type="button" class="pad-action pad-action--primary" onclick={handleConfirm}>Confirm</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pad-portal {
		position: fixed;
		inset: 0;
		z-index: 100;
		pointer-events: none;
	}

	.pad-overlay {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, rgba(9, 14, 24, 0.62) 84%, transparent);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 0;
		pointer-events: auto;
	}

	.pad-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: color-mix(in srgb, var(--surface-card-strong) 90%, var(--md-sys-color-surface-container-lowest) 10%);
		border: 1px solid var(--border-subtle);
		border-radius: 24px 24px 0 0;
		padding: 0.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
		box-shadow: 0 -14px 40px color-mix(in srgb, var(--theme-shadow-color) 88%, transparent);
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-height: min(calc(100dvh - env(safe-area-inset-top, 0px) - 0.5rem), 42rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		max-width: 29rem;
		margin: 0 auto;
		animation: pad-sheet-enter 320ms cubic-bezier(0.2, 0.9, 0.2, 1);
		will-change: transform;
		contain: layout paint style;
		pointer-events: auto;
	}

	.pad-sheet--dragging {
		transition: none;
	}

	.pad-handle {
		align-self: center;
		display: grid;
		place-items: center;
		width: 100%;
		padding: 0.25rem 0 0.1rem;
		background: transparent;
		border: 0;
		cursor: grab;
		touch-action: none;
	}

	.pad-handle:active {
		cursor: grabbing;
	}

	.pad-handle__bar {
		display: block;
		width: 3rem;
		height: 0.32rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--text-tertiary) 72%, transparent);
	}

	.pad-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex-shrink: 0;
	}

	.pad-label {
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.pad-display {
		font-size: clamp(2.35rem, 10vw, 4rem);
		line-height: 1;
	}

	.pad-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(0.45rem, 1.8vh, 0.75rem);
		max-width: 26rem;
		margin: 0 auto;
		width: 100%;
		flex: 1 1 auto;
		align-content: start;
	}

	.pad-btn {
		position: relative;
		min-height: clamp(3rem, 7.8vh, 3.5rem);
		background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 94%, white 6%);
		color: var(--text-primary);
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		font-size: clamp(1.35rem, 4vw, 1.75rem);
		font-family: 'Archivo', sans-serif;
		font-weight: 700;
		padding: clamp(0.65rem, 1.8vh, 0.95rem) 0;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition:
			background 100ms ease,
			transform 100ms ease,
			box-shadow 120ms ease,
			border-color 120ms ease;
		-webkit-tap-highlight-color: transparent;
		box-shadow: inset 0 1px 0 color-mix(in srgb, white 46%, transparent);
	}

	.pad-btn:hover {
		background: color-mix(in srgb, var(--md-sys-color-primary-container) 36%, var(--md-sys-color-surface-container-highest) 64%);
		border-color: color-mix(in srgb, var(--md-sys-color-primary) 22%, var(--border-subtle) 78%);
	}

	.pad-btn:active {
		background: color-mix(in srgb, var(--md-sys-color-primary-container) 68%, var(--md-sys-color-surface-container-highest) 32%);
		transform: scale(0.96);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
	}

	.pad-preview {
		position: absolute;
		left: 50%;
		top: -0.2rem;
		transform: translate(-50%, -90%) scale(0.88);
		min-width: 2.65rem;
		padding: 0.45rem 0.5rem;
		border-radius: 14px;
		background: color-mix(in srgb, var(--surface-floating-solid) 94%, white 6%);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-soft);
		opacity: 0;
		pointer-events: none;
		transition: opacity 90ms ease, transform 90ms ease;
	}

	.pad-preview--visible {
		opacity: 1;
		transform: translate(-50%, -110%) scale(1);
	}

	.pad-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.65rem;
		max-width: 26rem;
		margin: 0 auto;
		width: 100%;
		flex-shrink: 0;
	}

	.pad-action {
		min-height: 2.85rem;
		padding: 0.75rem 1rem;
		border-radius: 999px;
		border: 1px solid var(--border-subtle);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		transition: transform 100ms ease, background 120ms ease, border-color 120ms ease;
	}

	.pad-action:active {
		transform: scale(0.98);
	}

	.pad-action--secondary {
		margin-right: auto;
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 86%, transparent);
		color: var(--text-primary);
	}

	.pad-action--primary {
		background: var(--interactive-primary);
		border-color: transparent;
		color: var(--md-sys-color-on-primary);
		box-shadow: var(--interactive-primary-shadow);
	}

	@keyframes pad-sheet-enter {
		0% {
			opacity: 0;
			transform: translateY(2.2rem) scale(0.985);
		}

		70% {
			opacity: 1;
			transform: translateY(-0.25rem) scale(1);
		}

		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 30rem) {
		.pad-sheet {
			padding-inline: 1rem;
			gap: 1.25rem;
		}

		.pad-grid,
		.pad-actions {
			max-width: none;
		}

		.pad-actions {
			justify-content: stretch;
		}

		.pad-action {
			flex: 1 1 0;
		}

		.pad-action--secondary {
			margin-right: 0;
		}
	}

	@media (max-height: 46rem) {
		.pad-sheet {
			gap: 1rem;
			padding-top: 0.35rem;
			padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		}

		.pad-header {
			gap: 0.25rem;
		}

		.pad-label {
			font-size: 0.78rem;
		}

		.pad-display {
			font-size: clamp(2rem, 8.5vw, 2.75rem);
		}

		.pad-grid {
			gap: 0.5rem;
		}

		.pad-btn {
			min-height: 2.85rem;
			font-size: 1.3rem;
			padding-block: 0.55rem;
		}

		.pad-action {
			min-height: 2.6rem;
			padding-block: 0.65rem;
		}
	}

	@media (max-height: 38rem) {
		.pad-sheet {
			gap: 0.85rem;
			padding-inline: 0.9rem;
		}

		.pad-display {
			font-size: clamp(1.75rem, 7vw, 2.3rem);
		}

		.pad-grid {
			gap: 0.4rem;
		}

		.pad-btn {
			min-height: 2.55rem;
			font-size: 1.15rem;
		}

		.pad-actions {
			gap: 0.5rem;
		}

		.pad-action {
			min-height: 2.4rem;
			padding-inline: 0.85rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pad-sheet,
		.pad-btn,
		.pad-preview,
		.pad-action {
			animation: none;
			transition-duration: 0.01ms;
        }
    }
</style>
