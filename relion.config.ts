import { defineConfig } from 'relion'

export default defineConfig({
	bump: true,
	changelog: true,
	commit: { gpgSign: true },
	tag: { gpgSign: true },
	newTagPrefix: '',
	_github: {
		bump: false,
		commit: false,
		tag: false,
		logLevel: 'silent',
		context: { commitHyperlink: false },
		changelog: {
			output: 'stdout',
			header: '',
			commitRange: 'latest-release',
			partials: {
				header: '',
				main: '',
				changelogUrl: '{{repo.homepage}}/blob/main/CHANGELOG.md',
				footer: fallback => fallback.replace('&nbsp; ', '$&[_Release Changelog_]({{>changelogUrl}}) &ensp;•&ensp; '),
			},
		},
	},
})