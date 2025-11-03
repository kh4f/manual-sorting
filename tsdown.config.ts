import { defineConfig } from 'tsdown'
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import syncroid from 'vite-plugin-syncroid'

const isProd = process.argv.includes('--prod')
const useSyncroid = existsSync('syncroid.config.ts')
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
	external: ['obsidian'],
	noExternal: ['sortablejs', 'monkey-around'],
	env: { DEV: !isProd },
	plugins: [useSyncroid && syncroid({})],
})