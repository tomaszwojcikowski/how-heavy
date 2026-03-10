# How Heavy

How Heavy is a mobile-first SvelteKit app for planning barbell loading with CrossFit-style bumper plates and change plates.

It supports two modes:

- target mode: enter a desired total weight and get the exact or nearest achievable one-side plate stack
- current mode: tap the plates already on one side of the bar and calculate the full loaded weight

The app is configured for static deployment to GitHub Pages at `https://tomaszwojcikowski.github.io/how-heavy/` and uses GitHub Actions for CI and deployment.

## Stack

- SvelteKit with TypeScript
- `@sveltejs/adapter-static` for GitHub Pages
- SVG-based custom plate graphics
- Vitest and Testing Library for tests
- ESLint and Prettier for code quality
- `idb-keyval` for local persistence

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

## Quality Checks

Run type and Svelte checks:

```bash
npm run check
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm run test:run
```

## Production Build

Build for GitHub Pages:

```bash
BASE_PATH=/how-heavy npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

- `.github/workflows/ci.yml` runs checks, linting, tests, and a build verification step
- `.github/workflows/deploy.yml` builds and publishes the site to GitHub Pages
- the SvelteKit base path is `/how-heavy` for production builds

## Supported Equipment

- bars: 15 kg, 20 kg
- bumper plates: 5 kg, 10 kg, 15 kg, 20 kg
- change plates: 0.5 kg, 1 kg, 1.25 kg, 1.5 kg, 2 kg, 2.5 kg
