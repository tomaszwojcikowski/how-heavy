# AGENTS.md

## Project Overview

How Heavy is a mobile-first SvelteKit app for barbell loading.

- `src/routes/target` finds plates for a requested total.
- `src/routes/current` calculates total load from selected plates.
- `src/routes/sets` builds percentage-based training sets from a remembered 1RM.
- The app is statically deployed to GitHub Pages and must remain compatible with static output.

## Stack

- SvelteKit with TypeScript
- Material Web components
- Vitest for unit tests
- `idb-keyval` for persisted calculator state

## Key Repository Conventions

### Shared state and persistence

- Use `src/lib/stores/calculator.ts` for cross-route persisted calculator state.
- Keep bar preference shared across the app through `preferences.preferredBarWeight`.
- Persist 1RM and other calculator state in the same store rather than introducing separate browser storage paths.

### Theme behavior

- The global UI theme is driven by the selected bar weight.
- Apply theme changes through `src/lib/utils/theme.ts`.
- `20` kg is the blue theme and `15` kg is the pink theme.
- Theme state is applied through `document.documentElement.dataset.barTheme` and styled in `src/app.css`.

### Calculation logic

- Keep calculation logic in `src/lib/utils/` as pure functions.
- Add or update tests before changing calculation behavior.
- `src/lib/utils/calculations.ts` uses a cached lookup-table approach for plate combinations; preserve the existing tiebreak behavior unless requirements change.
- Keep gym-facing outputs practical: heavier plates first and stable tie-breaking for equivalent solutions.

### UI patterns

- Reuse shared components from `src/lib/components/` before creating route-specific controls.
- Sets-page bar controls should follow the same interaction language as the percentage stepper.
- Preserve the app's mobile-first layout and large touch targets.

## Validation

Run these commands after meaningful changes:

- `npm run test:run`
- `npm run check`
- `npm run lint`

## File Map

- `src/lib/components/` shared UI controls and plate visuals
- `src/lib/stores/calculator.ts` persisted calculator state
- `src/lib/utils/calculations.ts` target and current-load logic
- `src/lib/utils/sets.ts` training set sequencing
- `src/lib/utils/plates.ts` supported equipment definitions
- `src/routes/+layout.svelte` app shell and theme bootstrap

## Change Guidance

- Prefer focused edits over broad refactors.
- Do not introduce server-only features.
- When changing calculator behavior, update the related Vitest coverage in `src/lib/utils/*.test.ts`.
- When changing persisted UX defaults, make sure the home page, target page, current page, and sets page stay consistent.