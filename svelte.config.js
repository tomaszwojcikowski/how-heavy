import adapter from '@sveltejs/adapter-static';

const isDevServer = process.argv.includes('dev');
const basePath = isDevServer ? '' : process.env.BASE_PATH ?? '/how-heavy';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build'
		}),
		paths: {
			base: basePath
		},
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
