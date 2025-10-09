import { type PluginSettings } from '@/types.d'

export const MANUAL_SORTING_MODE_ID = 'manual-sorting'

export const DEFAULT_SETTINGS: PluginSettings = {
	customFileOrder: { '/': [] },
	draggingEnabled: true,
	selectedSortOrder: 'manual-sorting',
	debugMode: !!process.env.DEV,
	newItemsPosition: 'top',
}