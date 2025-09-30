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
}

export type FileOrder = Record<string, string[]>

declare module 'obsidian-typings' {
	interface FileExplorerView {
		autoRevealButtonEl: HTMLDivElement
		headerDom: { addNavButton(icon: IconName, title: string, callback: (evt: MouseEvent) => void): HTMLElement }
		onRename(file: TAbstractFile, oldPath: string): void
		updateShowUnsupportedFiles(): void
	}

	interface InfinityScroll {
		scrollIntoView(target: { el: HTMLElement }, ...args: unknown[]): void
	}

	interface InfinityScrollRootEl {
		childrenEl: HTMLElement
	}
}

interface SortablePrototype extends Sortable {
	_onDragOver(this: this, evt: DragEvent): unknown
}