import { TFolder } from 'obsidian'
import type { FileTreeItem } from 'obsidian-typings'

export interface Settings {
	customOrder: FileOrder
	debugMode: boolean
	newItemPlacement: 'top' | 'bottom'
}

export type FileOrder = Record<string, {
	children: string[]
	sortOrder: SortOrder
}>

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