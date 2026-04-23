import { TFolder } from 'obsidian'
import type { FileTreeItem, FileExplorerView } from 'obsidian-typings'
import { around } from 'monkey-around'
import type ManualSortingPlugin from '@/plugin'
import type { FolderSettings, ItemSettings } from '@/types'
import { getFileExplorerView, initLog } from '@/utils'
import { sortFolderItems } from './sort-folder-items'

const isFolderSettings = (item: ItemSettings | undefined): item is FolderSettings => !!item && 'children' in item

export class Patcher {
	private explorerUninstaller: ReturnType<typeof around> | null = null
	private log = initLog('PATCHER', '#988bff')

	constructor(private plugin: ManualSortingPlugin) {}

	patchExplorer() {
		const plugin = this.plugin

		this.explorerUninstaller = around(Object.getPrototypeOf(getFileExplorerView()) as FileExplorerView, {
			getSortedFolderItems: original => function (this: FileExplorerView, folder: TFolder, bypass?: boolean): FileTreeItem[] {
				const sortedItems = original.call(this, folder)
				if (bypass) return sortedItems
				const folderPath = folder.path
				const folderOrder = plugin.settings.items[folderPath]
				if (!isFolderSettings(folderOrder)) return sortedItems
				return sortFolderItems(sortedItems, folderOrder.sortOrder, folderOrder.children)
			},
		})
	}

	unpatchExplorer() {
		if (!this.explorerUninstaller) return
		this.explorerUninstaller()
		this.explorerUninstaller = null
		this.log('Explorer unpatched')
	}
}