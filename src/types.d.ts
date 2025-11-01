import { IconName, TAbstractFile } from 'obsidian'
import type Sortable from 'sortablejs'
import type { i18n } from 'i18next'

declare global {
	const i18next: i18n
}

export interface PluginSettings {
	customFileOrder: FileOrder
	selectedSortOrder: string
	draggingEnabled: boolean
	debugMode: boolean
	newItemsPosition: 'top' | 'bottom'
	syncMonitorObs: boolean
	syncInactivityResetMs: number
}

export type FileOrder = Record<string, string[]>

declare module 'obsidian-typings' {
	interface FileExplorerView {
		autoRevealButtonEl: HTMLDivElement
		headerDom: HeaderDom
		onRename(file: TAbstractFile, oldPath: string): void
		updateShowUnsupportedFiles(): void
	}

	interface HeaderDom {
		addNavButton(icon: IconName, title: string, callback: (evt: MouseEvent) => void): HTMLElement
	}

	interface InfinityScroll {
		scrollIntoView(target: { el: HTMLElement }, ...args: unknown[]): void
	}

	interface InfinityScrollRootEl {
		childrenEl: HTMLElement
	}

	interface TreeItem {
		setCollapsed(collapsed: boolean, check: boolean): void
	}
}

declare module 'sortablejs' {
	interface SortablePrototype extends Sortable {
		_onDragOver(this: this, evt: DragEvent): unknown
	}
}

export type LogLevel = 'debug' | 'silent'

export type LogMethod = 'log' | 'warn' | 'error'