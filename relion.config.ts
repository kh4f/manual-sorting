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
	bump: ['package.json', manifestBumper, versionsBumper],
	commit: { gpgSign: true },
	tag: { gpgSign: true },
	newTagPrefix: '',
	_github: {
		bump: false,
		commit: false,
		tag: false,
		logLevel: 'silent',
		context: {
			commitHyperlink: false,
			refHyperlink: false,
			footerChangelogUrl: true,
		},
		changelog: {
			output: 'stdout',
			commitRange: 'latest-release',
			header: '',
			partials: { header: '', main: '' },
		},
	},
})