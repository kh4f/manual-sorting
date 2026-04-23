import { Menu, TFolder } from 'obsidian'
import type { FileTreeItem, FileExplorerView } from 'obsidian-typings'
import { around } from 'monkey-around'
import type ManualSortingPlugin from '@/plugin'
import type { FolderSettings, ItemSettings } from '@/types'
import { getFileExplorerView, initLog } from '@/utils'
import { sortFolderItems } from './sort-folder-items'
import { mountFileControls } from '@/ui/file-controls'

const isFolderSettings = (item: ItemSettings | undefined): item is FolderSettings => !!item && 'children' in item

const log = initLog('PATCHER', '#988bff')

export class Patcher {
	private explorerUninstaller: ReturnType<typeof around> | null = null
	private menuUninstaller: ReturnType<typeof around> | null = null

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

		this.menuUninstaller = around(Menu.prototype, {
			showAtMouseEvent: original => function (this: Menu, event: MouseEvent) {
				const openMenuBtn = event.target as HTMLElement
				if (!(openMenuBtn.getAttribute('aria-label') === i18next.t('plugins.file-explorer.action-change-sort')))
					return original.call(this, event)

				const menuScroll = this.dom.querySelector<HTMLElement>('.menu-scroll')!
				menuScroll.addClass('ms-file-controls', 'menu-item', 'is-label')
				mountFileControls(menuScroll, plugin.app.vault.root, plugin)

				return original.call(this, event)
			},
		})
	}

	unpatchExplorer() {
		if (!this.explorerUninstaller) return
		this.explorerUninstaller()
		this.explorerUninstaller = null

		if (!this.menuUninstaller) return
		this.menuUninstaller()
		this.menuUninstaller = null

		log('Explorer unpatched')
	}
}

void `css
	.menu:has(.menu-scroll.ms-file-controls) {
		border-radius: 16px;
	}
`