export type NewItemPlacement = 'top' | 'bottom'

export type SortOrder =
	| 'custom'
	| 'byName'
	| 'byNameReverse'
	| 'byCreatedTime'
	| 'byCreatedTimeReverse'
	| 'byModifiedTime'
	| 'byModifiedTimeReverse'

export interface Settings {
	items: Record<string, ItemSettings>
	pinnedFiles: string[]
	showHidden: boolean
	newItemPlacement: NewItemPlacement
	persistOrderOnCreateDelete: boolean
	debugMode: boolean
}

export interface BaseItemSettings {
	isPinned: boolean
	isHidden: boolean
}

export interface FolderSettings extends BaseItemSettings {
	customOrder: string[]
	sortOrder: SortOrder
}

export type ItemSettings = BaseItemSettings | FolderSettings