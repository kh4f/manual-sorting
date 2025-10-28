import { readFileSync } from 'node:fs'
import { defineConfig, type Bumper } from 'relion'

const manifestBumper: Bumper = {
	file: 'manifest.json',
	pattern: /(version": )".*"/,
	replacement: `$1"{{newVersion}}"`,
}

const versionsBumper: Bumper = {
	file: 'versions.json',
	pattern: /(.*")/s,
	replacement: `$1,\n\t"{{newVersion}}": "${/(^.*?minAppVersion": ")(.*?)(")/s.exec(readFileSync('manifest.json', 'utf8'))?.[2]}"`,
}

export default defineConfig({
	newTagPrefix: '',
	_default: {
		lifecycle: 'all',
		bump: ['package.json', manifestBumper, versionsBumper],
		changelog: { review: true },
		commit: { gpgSign: true },
		tag: { gpgSign: true },
	},
	_github: {
		lifecycle: ['changelog'],
		logLevel: 'silent',
		context: { commitRefLinks: false, footerChangelogUrl: true },
		changelog: {
			output: 'stdout',
			commitRange: 'latest-release',
			header: '',
			partials: { header: '', body: '{{fromFile}}' },
		},
	},
})