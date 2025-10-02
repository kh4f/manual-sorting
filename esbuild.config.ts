import { context, type BuildOptions } from 'esbuild'
import { pathToFileURL } from 'node:url'

const isProd = process.argv.includes('--prod')
const isWatch = process.argv.includes('--watch')
const dirUrl = pathToFileURL(import.meta.dirname).href

const ctx = await context({
	entryPoints: ['src/plugin.ts'],
	bundle: true,
	external: ['obsidian'],
	format: 'cjs',
	outfile: 'main.js',
	minify: isProd,
	logLevel: 'info',
	sourcemap: true,
	sourceRoot: dirUrl,
} as BuildOptions)

if (isWatch) {
	await ctx.watch()
} else {
	await ctx.rebuild()
	process.exit(0)
}