import { type PluginSettings } from '@/types'


export const MANUAL_SORTING_MODE_ID = 'manual-sorting';

export const DEFAULT_SETTINGS: PluginSettings = {
	customFileOrder: { "/": [] },
	draggingEnabled: true,
	selectedSortOrder: 'manual-sorting',
};
