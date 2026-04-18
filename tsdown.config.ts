import { pathToFileURL } from 'node:url'
import { defineConfig } from 'tsdown'
import voicss from '@voicss/vite'

const isProd = process.argv.includes('-p')
const dirUrl = pathToFileURL(import.meta.dirname).href

export default defineConfig({
	entry: 'src/plugin.ts',
	outputOptions: {
		entryFileNames: 'main.js',
		minify: isProd,
		sourcemapBaseUrl: dirUrl,
		sourcemapPathTransform: relativeSourcePath => `${dirUrl}/${relativeSourcePath}`,
	},
	sourcemap: !isProd,
	format: 'cjs',
	outDir: '.',
	clean: false,
	deps: { onlyBundle: 'monkey-around', neverBundle: 'obsidian' },
	env: { DEV: !isProd },
	plugins: [voicss()],
	css: { fileName: 'styles.css' },
})