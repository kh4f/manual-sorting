import { TFolder } from 'obsidian'
import type { FileTreeItem } from 'obsidian-typings'

export interface Settings {
	items: ItemSettingsMap
	debugMode: boolean
	newItemPlacement: 'top' | 'bottom'
}

export interface BaseItemSettings {
	pinned: boolean
	hidden: boolean
}

export interface FolderSettings extends BaseItemSettings {
	children: string[]
	sortOrder: SortOrder
}

export type ItemSettings = BaseItemSettings | FolderSettings
export type ItemSettingsMap = Record<string, ItemSettings | undefined>

export type SortOrder =
	| 'custom'
	| 'alphabetical'
	| 'alphabeticalReverse'
	| 'byCreatedTime'
	| 'byCreatedTimeReverse'
	| 'byModifiedTime'
	| 'byModifiedTimeReverse'

declare module 'obsidian-typings' {
	interface FileExplorerView {
		getSortedFolderItems(folder: TFolder, bypass?: boolean): FileTreeItem[]
	}

	interface TreeItem {
		collapsed: boolean
		setCollapsed(collapsed: boolean, check: boolean): void
	}
}