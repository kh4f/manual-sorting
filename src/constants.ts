import { type PluginSettings } from '@/types'

export const CUSTOM_SORT_ORDER_ID = 'custom'

export const DEFAULT_SETTINGS: PluginSettings = {
	customOrder: { '/': { children: [], sortOrder: 'custom' } },
	sortOrder: 'custom',
	debugMode: !!process.env.DEV,
	newItemPlacement: 'top',
}