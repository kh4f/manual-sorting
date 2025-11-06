import { TFolder } from 'obsidian'
import type { FileTreeItem } from 'obsidian-typings'
import type { i18n } from 'i18next'

declare global {
	const i18next: i18n
}

export interface PluginSettings {
	customOrder: FileOrder
	sortOrder: string
	debugMode: boolean
	newItemPlacement: 'top' | 'bottom'
}

export type FileOrder = Record<string, string[]>

declare module 'obsidian-typings' {
	interface FileExplorerView {
		getSortedFolderItems(folder: TFolder, bypass?: boolean): FileTreeItem[]
	}

	interface TreeItem {
		collapsed: boolean
		setCollapsed(collapsed: boolean, check: boolean): void
	}
}

export type LogLevel = 'debug' | 'silent'

export type LogMethod = 'log' | 'warn' | 'error'