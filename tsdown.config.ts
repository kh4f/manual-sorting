import { defineConfig } from 'tsdown'
import { pathToFileURL } from 'node:url'
import syncroid from 'vite-plugin-syncroid'
import dotenv from 'dotenv'

dotenv.config()
const isProd = process.argv.includes('--prod')
const useSyncroid = process.env.USE_SYNCROID !== undefined
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
	plugins: [useSyncroid && syncroid({})],
})