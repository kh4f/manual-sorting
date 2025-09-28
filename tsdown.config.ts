import { defineConfig } from 'tsdown'

const isProd = process.argv.includes('--prod')

export default defineConfig({
	entry: 'src/plugin.ts',
	outputOptions: {
		entryFileNames: 'main.js',
		minify: isProd,
	},
	format: 'cjs',
	outDir: '.',
	clean: false,
	external: ['obsidian'],
	noExternal: ['sortablejs', 'monkey-around'],
})