import { type PluginSettings } from '@/types'

export const CUSTOM_SORTING_ID = 'custom'

export const FILE_EXPLORER_SELECTOR = '[data-type="file-explorer"] > .nav-files-container'

export const DEFAULT_SETTINGS: PluginSettings = {
	customOrder: { '/': { children: [], sortOrder: 'custom' } },
	sortOrder: 'custom',
	debugMode: !!process.env.DEV,
	newItemPlacement: 'top',
}