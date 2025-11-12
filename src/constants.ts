import { type PluginSettings } from '@/types.d'

export const CUSTOM_SORTING_ID = 'customOrder'

export const FILE_EXPLORER_SELECTOR = '[data-type="file-explorer"] > .nav-files-container'

export const DEFAULT_SETTINGS: PluginSettings = {
	customOrder: { '/': [] },
	sortOrder: 'customOrder',
	debugMode: !!process.env.DEV,
	newItemPlacement: 'top',
}