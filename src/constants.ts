import { type PluginSettings } from '@/types.d'

export const MANUAL_SORTING_MODE_ID = 'manual-sorting'

export const DND_MIN_SWAP_THRESHOLD = 0.3
export const DND_MAX_SWAP_THRESHOLD = 2

export const FILE_EXPLORER_SELECTOR = '[data-type="file-explorer"] .nav-files-container'

export const DEFAULT_SETTINGS: PluginSettings = {
	customFileOrder: { '/': [] },
	draggingEnabled: true,
	selectedSortOrder: 'manual-sorting',
	debugMode: !!process.env.DEV,
	newItemsPosition: 'top',
}