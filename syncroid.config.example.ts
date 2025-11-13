// Copy this file as 'syncroid.config.ts' to make the syncroid plugin use the config file
// To enable syncroid in tsdown, set USE_SYNCROID=true in the .env file

import type { UserConfig } from 'vite-plugin-syncroid'

export default {
	source: 'c:/obsidian/dev-vault',
	exclude: ['**/plugins/*/**/!(manifest.json|main.js|styles.css|data.json)'],
	dest: '/storage/emulated/0/documents/dev-vault',
} as UserConfig