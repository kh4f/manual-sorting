import { pathToFileURL } from 'node:url'
import { defineConfig } from 'tsdown'

const isProd = process.argv.includes('--prod')
const dirUrl = pathToFileURL(import.meta.dirname).href

export default defineConfig({
	entry: 'src/plugin.ts',
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
	deps: { onlyAllowBundle: 'monkey-around', neverBundle: 'obsidian' },
	env: { DEV: !isProd },
})