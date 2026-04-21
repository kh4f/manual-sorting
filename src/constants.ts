import type { Settings } from '@/types'

export const CUSTOM_SORT_ORDER_ID = 'custom'

export const DEFAULT_SETTINGS: Settings = {
	customOrder: { '/': { children: [], sortOrder: 'custom' } },
	debugMode: !!process.env.DEV,
	newItemPlacement: 'top',
}