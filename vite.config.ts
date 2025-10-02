import { resolve } from 'path'
import { defineConfig } from 'rolldown-vite'
import { pathToFileURL } from 'node:url'

const dirUrl = pathToFileURL(import.meta.dirname).href

export default defineConfig(({ mode }) => ({
	resolve: { alias: { '@': resolve('src') } },
	build: {
		minify: mode === 'production',
		sourcemap: true,
		lib: {
			entry: './src/plugin.ts',
			formats: ['cjs'],
		},
		emptyOutDir: false,
		rollupOptions: {
			output: {
				entryFileNames: 'main.js',
				dir: '.',
				sourcemapBaseUrl: dirUrl,
				sourcemapPathTransform: relativeSourcePath =>
					`${dirUrl}/${relativeSourcePath}`,
			},
			external: ['obsidian'],
		},
	},
}))