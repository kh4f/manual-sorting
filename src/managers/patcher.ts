import { Menu, MenuItem, TFolder } from 'obsidian'
import type { FileTreeItem, FileExplorerView } from 'obsidian-typings'
import { around } from 'monkey-around'
import { ResetOrderModal } from '@/components'
import { CUSTOM_SORTING_ID } from '@/constants'
import type ManualSortingPlugin from '@/plugin'
import { DndManager } from '@/managers/dnd-manager'
import { Logger } from '@/utils'

export class Patcher {
	private explorerUninstaller: ReturnType<typeof around> | null = null
	private menuUninstaller: ReturnType<typeof around> | null = null
	private dndManager: DndManager
	private log = new Logger('PATCHER', '#988bff')

	constructor(private plugin: ManualSortingPlugin) {
		this.dndManager = new DndManager(plugin)
	}

	patchExplorer() {
		const patcher = this
		const plugin = this.plugin
		const fileExplorerView = plugin.getFileExplorerView()

		this.explorerUninstaller = around(Object.getPrototypeOf(fileExplorerView) as FileExplorerView, {
			getSortedFolderItems: original => function (this: FileExplorerView, folder: TFolder, bypass?: boolean): FileTreeItem[] {
				const sortedItems = original.call(this, folder)
				if (bypass || !plugin.isCustomSortingActive()) return sortedItems
				const folderPath = folder.path
				const customOrder = plugin.settings.customOrder[folderPath]
				return sortedItems.sort((a, b) => customOrder.indexOf(a.file.path) - customOrder.indexOf(b.file.path))
			},
			setSortOrder: original => function (this: FileExplorerView, sortOrder: string) {
				original.call(this, sortOrder)
				patcher.log.info('Sort order changed to:', sortOrder)
				const hadCustomSortingBeenActive = plugin.isCustomSortingActive()
				plugin.settings.sortOrder = sortOrder
				void plugin.saveSettings()
				if (hadCustomSortingBeenActive && !plugin.isCustomSortingActive()) {
					plugin.dndManager.disable()
					plugin.getFileExplorerView().sort()
				}
			},
		})
	}

	patchSortOrderMenu() {
		const plugin = this.plugin

		this.menuUninstaller = around(Menu.prototype, {
			showAtMouseEvent: original => function (this: Menu, ...args) {
				const openMenuButton = args[0].target as HTMLElement
				if (openMenuButton.getAttribute('aria-label') === i18next.t('plugins.file-explorer.action-change-sort')
					&& openMenuButton.classList.contains('nav-action-button')
				) {
					const menu = this
					if (plugin.isCustomSortingActive()) {
						const checkedItem = menu.items.find((item): item is MenuItem => item instanceof MenuItem && item.checked === true)
						if (checkedItem) checkedItem.setChecked(false)
					}

					const sortingMenuSection = CUSTOM_SORTING_ID
					menu.addItem((item: MenuItem) => {
						item.setTitle('Manual sorting')
							.setIcon('pin')
							.setChecked(plugin.isCustomSortingActive())
							.setSection(sortingMenuSection)
							.onClick(() => {
								if (!plugin.isCustomSortingActive()) {
									plugin.settings.sortOrder = CUSTOM_SORTING_ID
									plugin.orderManager.reconcileOrder()
									void plugin.saveSettings()
									plugin.getFileExplorerView().sort()
									void plugin.dndManager.enable()
								}
							})
					})
					menu.addItem((item: MenuItem) => {
						item.setTitle('Reset order')
							.setIcon('trash-2')
							.setSection(sortingMenuSection)
							.onClick(() => {
								new ResetOrderModal(plugin.app, () => {
									plugin.orderManager.resetOrder()
									plugin.orderManager.reconcileOrder()
									void plugin.saveSettings()
									plugin.getFileExplorerView().sort()
								}).open()
							})
					})
					const menuItems = menu.items
					const menuSeparator = menuItems.splice(8, 1)[0]
					menuItems.splice(0, 0, menuSeparator)
				}
				return original.apply(this, args)
			},
		})
	}

	unpatchExplorer() {
		if (!this.explorerUninstaller) return
		this.explorerUninstaller()
		this.explorerUninstaller = null
		this.log.info('Explorer unpatched')
	}

	unpatchSortOrderMenu() {
		if (!this.menuUninstaller) return
		this.menuUninstaller()
		this.menuUninstaller = null
		this.log.info('Sort order menu unpatched')
	}
}