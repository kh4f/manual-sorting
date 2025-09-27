import esbuild from 'esbuild'
import { createEsbuildConfig } from './esbuild.config'

const prod = process.argv.includes('--production')

async function runEsbuild() {
	const esbuildConfig = createEsbuildConfig(prod)
	const context = await esbuild.context(esbuildConfig)

	if (prod) {
		await context.rebuild()
		process.exit(0)
	} else {
		await context.watch()
	}
}

runEsbuild().catch((err) => {
	console.error('Error during build:', err)
	process.exit(1)
})