import { TFolder } from 'obsidian'
import { CUSTOM_SORT_ORDER_ID } from '@/constants'
import type { FileTreeItem, FileExplorerViewSortOrder } from 'obsidian-typings'

export interface PluginSettings {
	customOrder: FileOrder
	sortOrder: SortOrder
	debugMode: boolean
	newItemPlacement: 'top' | 'bottom'
}

export type FileOrder = Record<string, {
	children: string[]
	sortOrder: SortOrder
}>

declare module 'obsidian-typings' {
	interface FileExplorerView {
		getSortedFolderItems(folder: TFolder, bypass?: boolean): FileTreeItem[]
	}

	interface TreeItem {
		collapsed: boolean
		setCollapsed(collapsed: boolean, check: boolean): void
	}
}

export type SortOrder = FileExplorerViewSortOrder | typeof CUSTOM_SORT_ORDER_ID

export type LogLevel = 'debug' | 'silent'

export type LogMethod = 'log' | 'warn' | 'error'