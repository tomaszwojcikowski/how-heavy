# How Heavy - Implementation Plan

## Product Goal

Build a mobile-first Svelte app that helps users:

1. Calculate which plates to load on each side of the bar for a target total weight.
2. Calculate the current total weight based on the plates already loaded on one side.

The app should have a colorful Material Design 3-inspired UI, work well on web and mobile, and require no authentication.

Repository: `https://github.com/tomaszwojcikowski/how-heavy`

Planned public deployment URL: `https://tomaszwojcikowski.github.io/how-heavy/`

## Core Requirements

- Bar options: 15 kg or 20 kg.
- Bumper plates: 5, 10, 15, 20 kg.
- Small plates: 0.5, 1, 1.25, 1.5, 2, 2.5 kg.
- Input assumes symmetric loading on both sides of the bar.
- Plate interaction should be visual-first: users should tap realistic plate graphics, stacks, or trays instead of relying on plain numeric inputs.
- UX should prioritize speed, large touch targets, and low-friction interaction.

## Recommended Stack

### Framework

- SvelteKit
  - Best fit for a responsive Svelte app with clean routing and easy deployment.
  - For GitHub Pages, configure it as a fully static site.
- TypeScript
  - Keeps the plate calculation logic explicit and testable.
- `@sveltejs/adapter-static`
  - Required to generate a static build for GitHub Pages hosting.

### UI and Styling

- `@material/web`
  - Material Design 3 web components for buttons, chips, cards, text fields, and dialogs.
  - Good match for the MD3 requirement.
- `sass`
  - Useful for managing theme tokens, spacing, and component-level styling.
- `material-symbols`
  - Consistent icon set aligned with the Material design language.
- Native SVG components in Svelte
  - Best option for rendering scalable bumper plate graphics, side-stack previews, and animated barbell layouts without adding a heavy charting or canvas dependency.

### State and Forms

- Svelte stores
  - Enough for app-level state such as bar type, target weight, selected plate inventory, and current side-loaded plates.
- `zod`
  - Lightweight validation for numeric inputs and state parsing.

### Utilities and Quality

- `vitest`
  - Unit tests for weight calculation and plate selection logic.
- `@testing-library/svelte`
  - Component interaction tests for the key calculator flows.
- `eslint`
  - Keeps TypeScript and Svelte code consistent.
- `prettier`
  - Formatting.
- `prettier-plugin-svelte`
  - Proper formatting for Svelte files.

### Optional but Useful

- `vite-plugin-pwa`
  - Makes the app installable and improves mobile usage.
- `idb-keyval`
  - Persist last-used bar type and plate selections locally.

## Information Architecture

## Main Views

### 1. Target Weight Calculator

- User selects bar weight.
- User enters desired total weight.
- App returns exact plates to load on one side.
- App visualizes the recommended loading order as a graphical side-of-bar stack, not just a text list.
- App highlights whether the target is achievable with the supported plate set.

### 2. Current Weight Calculator

- User selects bar weight.
- User selects which plates are loaded on one side by tapping plate graphics from a visual tray.
- App calculates current total weight.

### 3. Shared Utilities

- Plate selector component.
- Plate graphic component.
- Bar-side stack preview component.
- Result summary card.
- Quick reset and swap actions.

## Functional Rules

### Total Weight Formula

`total = barWeight + 2 * oneSidePlateWeight`

### Target Weight Logic

- Convert target weight into required one-side plate weight:
  - `requiredSide = (targetWeight - barWeight) / 2`
- Reject invalid targets when:
  - target weight is lower than the bar weight
  - target weight cannot be split evenly across both sides
  - target cannot be formed from the supported plate increments
- Plate selection should prefer a practical gym-friendly layout:
  - heavier plates first
  - then smaller change plates

### Current Weight Logic

- Sum all selected plates on one side.
- Multiply by 2.
- Add selected bar weight.

## Suggested Project Structure

```text
static/
  .nojekyll
src/
  lib/
    components/
      BarSelector.svelte
      PlateGraphic.svelte
      PlatePicker.svelte
      PlateStackPreview.svelte
      ResultCard.svelte
      WeightKeypad.svelte
    stores/
      calculator.ts
    utils/
      plates.ts
      calculations.ts
      formatting.ts
    types/
      gym.ts
  routes/
    +layout.svelte
    +page.svelte
    target/
      +page.svelte
    current/
      +page.svelte
.github/
  workflows/
    ci.yml
    deploy.yml
```

## Deployment Target

### GitHub Pages

- Deploy as a static SvelteKit app using `@sveltejs/adapter-static`.
- This repository is a project page repository, so configure the SvelteKit base path as `/how-heavy`.
- Avoid server-only features and dynamic endpoints because GitHub Pages only serves static assets.
- Add a `.nojekyll` file so assets and generated folders are served correctly.
- Use a GitHub Actions workflow to build and deploy the `build` output to GitHub Pages.
- Run automated tests in GitHub Actions before deployment.
- Target repository: `tomaszwojcikowski/how-heavy`
- Target site URL: `https://tomaszwojcikowski.github.io/how-heavy/`

## CI/CD Strategy

### GitHub Actions

- `ci.yml`
  - Trigger on push and pull request.
  - Install dependencies with npm.
  - Run linting.
  - Run unit and component tests.
  - Optionally run a production build as a verification step.
- `deploy.yml`
  - Trigger on pushes to the main branch or via workflow dispatch.
  - Build the static site.
  - Publish to GitHub Pages using the official GitHub Pages Actions flow.
  - Depend on the test workflow or repeat the verification steps before deploy.

Recommended principle:

- No deployment without passing tests.

## Delivery Phases

### Phase 1 - Project Bootstrap

Goal: establish the app shell and tooling.

Tasks:

- Create a SvelteKit app with TypeScript.
- Configure `@sveltejs/adapter-static` for GitHub Pages.
- Set `paths.base = '/how-heavy'` for production builds.
- Add Material Web, Sass, icon font, and linting/formatting setup.
- Add GitHub Actions workflow scaffolding for CI and deployment.
- Define design tokens: primary, secondary, surface, spacing, radius, elevation.
- Define a consistent visual system for plate graphics: diameter classes, ring thickness, label placement, and colors by plate type.
- Add a base responsive layout optimized for mobile-first interaction.
- Add a development-safe base-path strategy so local dev still works cleanly.

Deliverable:

- Running app shell with navigation, theme scaffolding, and static deployment configuration.

### Phase 2 - Domain Model and Calculation Engine

Goal: implement reliable business logic before UI complexity grows.

Tasks:

- Define plate and bar constants.
- Define visual metadata per plate: display color, plate radius tier, text contrast, and render order.
- Implement pure functions for:
  - target weight to one-side load
  - one-side load to total weight
  - achievable target validation
  - recommended plate combination generation
- Add unit tests covering exact matches, invalid inputs, and edge cases.
- Make the test suite runnable in GitHub Actions without browser-specific manual setup.

Deliverable:

- Fully tested calculation module independent of UI.

### Phase 3 - Target Weight Calculator UI

Goal: deliver the primary use case.

Tasks:

- Build bar selector.
- Build target weight input with validation feedback.
- Build result card showing plates per side.
- Render a graphical stack preview for the recommended one-side load using SVG plates sized by type.
- Add quick actions such as clear, common gym presets, and error handling.

Deliverable:

- Users can enter a target total weight and see what to load.

### Phase 4 - Current Weight Calculator UI

Goal: support reverse calculation from existing plates.

Tasks:

- Build an interactive one-side plate picker using tappable illustrated plates instead of numeric counters.
- Show running subtotal for one side.
- Show final total including bar weight.
- Make switching between 15 kg and 20 kg bars immediate and obvious.

Deliverable:

- Users can recreate the loaded side and instantly see total weight.

### Phase 5 - UX Polish and Persistence

Goal: make the app fast and pleasant on phones.

Tasks:

- Add local persistence for recent settings.
- Improve touch interactions and visual feedback.
- Add motion for plate add/remove interactions and stack updates.
- Add subtle transitions for result changes.
- Refine color usage and hierarchy for MD3-style surfaces and actions.

Deliverable:

- Production-ready user experience with remembered preferences.

### Phase 6 - QA and Release

Goal: ship a stable first version.

Tasks:

- Add component tests for the main flows.
- Test responsive layouts on mobile and desktop widths.
- Verify keyboard accessibility and screen-reader labels.
- Optionally enable PWA install support.
- Add GitHub Actions workflows for CI and GitHub Pages deployment.
- Ensure deployment only runs after successful test and build verification.
- Verify asset paths and client-side navigation under the repository base path.

Deliverable:

- Release candidate suitable for web and mobile browser use on GitHub Pages.

## Key Edge Cases to Cover

- Target weight below selected bar weight.
- Target weight resulting in fractional side loads that cannot be represented.
- Empty plate selection in current-weight mode.
- Rapid switching between 15 kg and 20 kg bars.
- Very high target values that require clear error or limit messaging.

## UX Principles

- Mobile-first layout with sticky action areas where useful.
- Large, tap-friendly plate controls.
- Plate graphics should communicate real-world differences: bumper plates larger, change plates smaller, labels always legible.
- Fast switching between calculators.
- Results should be visible without scrolling on common phone sizes where possible.
- Avoid clutter: one primary action per screen section.

## First Release Scope

Include:

- Target weight calculator.
- Current weight calculator.
- 15 kg and 20 kg bars.
- Full supported plate list.
- Local persistence.
- Responsive MD3-style UI.

Defer:

- User accounts.
- Plate inventory limits per user.
- Multi-language support.
- Advanced training logs or workout history.

## Initial Install Set

```bash
npm create svelte@latest .
npm install @material/web zod
npm install -D @sveltejs/adapter-static typescript sass vitest @testing-library/svelte eslint prettier prettier-plugin-svelte vite-plugin-pwa
```

If icon font delivery is needed through npm instead of CDN, add the chosen Material Symbols package during setup.

## Deployment Notes

- Preferred deployment path: GitHub Pages via GitHub Actions, not manual file uploads.
- Repository: `tomaszwojcikowski/how-heavy`
- Final Pages URL: `https://tomaszwojcikowski.github.io/how-heavy/`
- CI provider: GitHub Actions
- Deployment provider: GitHub Actions to GitHub Pages
- Required SvelteKit settings:
  - static adapter
  - prerender enabled
  - `paths.base = '/how-heavy'` for Pages builds
- Required repository settings:
  - GitHub Pages source set to GitHub Actions
- Required workflows:
  - `ci.yml` for lint, test, and optional build verification
  - `deploy.yml` for GitHub Pages publishing
- Required generated artifacts:
  - static `build/` output
  - `.nojekyll`

## Recommended Build Order

1. Bootstrap SvelteKit and theme.
2. Implement and test calculation utilities.
3. Build target calculator.
4. Build current-weight calculator.
5. Add persistence and polish.
6. Configure GitHub Actions CI workflow for linting, tests, and build verification.
7. Configure GitHub Pages deployment workflow and validate base-path behavior.
8. Add final tests and ship.