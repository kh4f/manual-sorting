import { pathToFileURL } from 'node:url'
import { defineConfig } from 'tsdown'

const isProd = process.argv.includes('--prod')
const dirUrl = pathToFileURL(import.meta.dirname).href

export default defineConfig({
	entry: 'src/plugin.ts',
	inputOptions: { resolve: { extensions: ['.ts', '.d.ts']	} },
	outputOptions: {
		entryFileNames: 'main.js',
		minify: isProd,
		sourcemapBaseUrl: dirUrl,
		sourcemapPathTransform: relativeSourcePath =>
			`${dirUrl}/${relativeSourcePath}`,
	},
	sourcemap: !isProd,
	format: 'cjs',
	outDir: '.',
	clean: false,
	external: ['obsidian'],
	noExternal: ['monkey-around'],
	env: { DEV: !isProd },
})