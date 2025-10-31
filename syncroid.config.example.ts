// Copy this file as 'syncroid.config.ts' to enable syncroid plugin in tsdown

import type { UserConfig } from 'vite-plugin-syncroid'

export default {
	source: 'c:/obsidian/dev-vault',
	exclude: ['**/plugins/*/**/!(manifest.json|main.js|styles.css|data.json)'],
	dest: '/storage/emulated/0/documents/dev-vault',
} as UserConfig