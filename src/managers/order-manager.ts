import { TAbstractFile, TFolder } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import { getFileExplorerView, initLog } from '@/utils'
import type { BaseItemSettings, FolderSettings, ItemSettings, ItemSettingsMap } from '@/types'

type FolderOrder = Record<string, Pick<FolderSettings, 'children' | 'sortOrder'>>

const ROOT_PATH = '/'

const getParentPath = (path: string) => path.substring(0, path.lastIndexOf('/')) || ROOT_PATH

const isFolderSettings = (item: ItemSettings | undefined): item is FolderSettings => !!item && 'children' in item

const getDefaultItemSettings = (): BaseItemSettings => ({ pinned: false, hidden: false })

const pickItemSettings = (item: ItemSettings | undefined): BaseItemSettings => {
	if (!item) return getDefaultItemSettings()

	return {
		pinned: item.pinned,
		hidden: item.hidden,
	}
}

export class OrderManager {
	private log = initLog('ORDER-MANAGER', '#00ccff')

	constructor(private plugin: ManualSortingPlugin) {}

	add(item: TAbstractFile) {
		const path = item.path
		this.log(`Inserting new item: '${path}'`)
		const order = this.plugin.settings.items
		const dir = getParentPath(path)
		const isFolder = item instanceof TFolder
		const insertPos = this.plugin.settings.newItemPlacement

		if (isFolder) this.ensureFolderSettings(path)
		else order[path] ??= getDefaultItemSettings()

		const parentFolder = this.ensureFolderSettings(dir)
		if (insertPos === 'top') parentFolder.children.unshift(path)
		else parentFolder.children.push(path)

		this.logOrder('Updated order after adding new item:')
	}

	rename(oldPath: string, newPath: string) {
		this.log(`Renaming '${oldPath}' to '${newPath}'`)
		const order = this.plugin.settings.items
		const oldDir = getParentPath(oldPath)
		const oldParent = this.ensureFolderSettings(oldDir)

		oldParent.children = oldParent.children.map(path => (path === oldPath ? newPath : path))
		if (oldPath in order) this.renameItemSettings(oldPath, newPath)

		void this.plugin.saveSettings()
		this.logOrder('Updated order after renaming item:')
	}

	move(oldPath: string, newPath: string, targetSiblingPath: string, position: 'before' | 'after') {
		if (oldPath === newPath && targetSiblingPath === newPath) return
		this.log(`Moving '${oldPath}' to '${newPath}' (${position} '${targetSiblingPath}')`)
		const order = this.plugin.settings.items
		const oldDir = getParentPath(oldPath)
		const newDir = getParentPath(newPath)
		const oldParent = this.ensureFolderSettings(oldDir)
		const newParent = this.ensureFolderSettings(newDir)
		const isDirChanged = oldDir !== newDir

		oldParent.children = oldParent.children.filter(path => path !== oldPath)

		let insertIdx = 0
		if (targetSiblingPath) {
			const siblingIdx = newParent.children.indexOf(targetSiblingPath)
			insertIdx = position === 'before' ? siblingIdx : siblingIdx + 1
		}
		newParent.children.splice(insertIdx, 0, newPath)

		if (oldPath !== newPath && oldPath in order) this.renameItemSettings(oldPath, newPath)

		this.logOrder('Updated order after moving item:')
		if (!isDirChanged) {
			this.log('Directory did not change, calling sort on File Explorer manually')
			getFileExplorerView().sort()
		}
	}

	remove(path: string) {
		this.log(`Removing item: '${path}'`)
		const dir = getParentPath(path)
		const parentFolder = this.ensureFolderSettings(dir)

		parentFolder.children = parentFolder.children.filter(childPath => childPath !== path)
		this.removeItemSettings(path)

		this.logOrder('Updated order after removing item:')
	}

	reconcileOrder() {
		this.log('Updating order...')
		const currentOrder = this.getCurrentOrder()
		const savedOrder = this.plugin.settings.items
		const newOrder = this.matchSavedOrder(currentOrder, savedOrder)
		this.plugin.settings.items = newOrder
		this.logOrder('Order updated:')
	}

	resetOrder() {
		this.plugin.settings.items = { [ROOT_PATH]: { ...getDefaultItemSettings(), children: [], sortOrder: 'custom' } }
	}

	overwriteCustomOrder(folderPath: string) {
		const folderOrder = this.ensureFolderSettings(folderPath)
		const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath)
		if (!(folder instanceof TFolder)) return

		folderOrder.children = getFileExplorerView().getSortedFolderItems(folder).map(item => item.file.path)
		folderOrder.sortOrder = 'custom'
		this.log(`Custom order overwritten for '${folderPath}'`)
	}

	private logOrder(message: string) {
		this.log(message, JSON.stringify(this.plugin.settings.items, null, 4), 'group')
	}

	private getCurrentOrder() {
		const currentOrder: FolderOrder = {}
		const explorerView = getFileExplorerView()

		const indexFolder = (folder: TFolder) => {
			const sortedItems = explorerView.getSortedFolderItems(folder, true)
			const sortedItemPaths = sortedItems.map(item => item.file.path)
			currentOrder[folder.path] = { children: sortedItemPaths, sortOrder: 'custom' }

			for (const item of sortedItems) {
				const itemObject = item.file
				if (itemObject instanceof TFolder) indexFolder(itemObject)
			}
		}

		indexFolder(this.plugin.app.vault.root)
		return currentOrder
	}

	private matchSavedOrder(currentOrder: FolderOrder, savedOrder: ItemSettingsMap) {
		const result: ItemSettingsMap = {}
		const currentPaths = new Set<string>()

		for (const [folderPath, folder] of Object.entries(currentOrder)) {
			currentPaths.add(folderPath)
			folder.children.forEach(childPath => currentPaths.add(childPath))
		}

		for (const [path, item] of Object.entries(savedOrder)) {
			if (!currentPaths.has(path) || path in currentOrder) continue

			result[path] = pickItemSettings(item)
		}

		for (const folder in currentOrder) {
			const prevOrder = savedOrder[folder]
			if (isFolderSettings(prevOrder)) {
				const currentFiles = currentOrder[folder]
				// Leave the files that have already been saved
				const existingFiles = prevOrder.children.filter(file => currentFiles.children.includes(file))
				// Add new files to the beginning of the list
				const newFiles = currentFiles.children.filter(file => !prevOrder.children.includes(file))
				// Combine and remove duplicates
				result[folder] = {
					...pickItemSettings(prevOrder),
					children: Array.from(this.plugin.settings.newItemPlacement === 'top' ? [...newFiles, ...existingFiles] : [...existingFiles, ...newFiles]),
					sortOrder: prevOrder.sortOrder,
				}
			} else {
				// Remove duplicates from current folder
				result[folder] = {
					...pickItemSettings(prevOrder),
					children: Array.from(new Set(currentOrder[folder].children)),
					sortOrder: 'custom',
				}
			}
		}

		return result
	}

	private ensureFolderSettings(path: string) {
		const order = this.plugin.settings.items
		const item = order[path]

		if (isFolderSettings(item)) return item

		const folderSettings: FolderSettings = {
			...pickItemSettings(item),
			children: [],
			sortOrder: 'custom',
		}
		order[path] = folderSettings
		return folderSettings
	}

	private removeItemSettings(path: string) {
		const order = this.plugin.settings.items
		const item = order[path]
		if (isFolderSettings(item)) item.children.forEach(childPath => this.removeItemSettings(childPath))
		delete order[path]
	}

	private renameItemSettings(oldPath: string, newPath: string) {
		if (oldPath === newPath) return
		const order = this.plugin.settings.items
		const item = order[oldPath]
		if (!item) return

		order[newPath] = item
		delete order[oldPath]

		if (!isFolderSettings(item)) return

		item.children = item.children.map(path => {
			const newChildPath = path.replace(oldPath, newPath)
			if (path in order) this.renameItemSettings(path, newChildPath)
			return newChildPath
		})
	}
}