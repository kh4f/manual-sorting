import { TFolder } from 'obsidian'
import type { FileTreeItem, FileExplorerViewSortOrder } from 'obsidian-typings'
import type { i18n } from 'i18next'
import { CUSTOM_SORTING_ID } from '@/constants'

declare global {
	const i18next: i18n
}

export interface LegacyPluginSettings {
	customOrder: Record<string, string[]>
	sortOrder: string
	debugMode: boolean
	newItemPlacement: 'top' | 'bottom'
}

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

export type SortOrder = FileExplorerViewSortOrder | typeof CUSTOM_SORTING_ID

export type LogLevel = 'debug' | 'silent'

export type LogMethod = 'log' | 'warn' | 'error'