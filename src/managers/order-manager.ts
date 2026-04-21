import { TAbstractFile, TFolder } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import { getFileExplorerView, initLog } from '@/utils'
import type { FileOrder } from '@/types'

export class OrderManager {
	private log = initLog('ORDER-MANAGER', '#00ccff')

	constructor(private plugin: ManualSortingPlugin) {}

	add(item: TAbstractFile) {
		const path = item.path
		this.log(`Inserting new item: '${path}'`)
		const order = this.plugin.settings.customOrder
		const dir = path.substring(0, path.lastIndexOf('/')) || '/'
		const isFolder = item instanceof TFolder
		const insertPos = this.plugin.settings.newItemPlacement

		if (isFolder) order[path] = { children: [], sortOrder: 'custom' }
		if (insertPos === 'top') order[dir].children.unshift(path)
		else order[dir].children.push(path)

		this.logOrder('Updated order after adding new item:')
	}

	rename(oldPath: string, newPath: string) {
		this.log(`Renaming '${oldPath}' to '${newPath}'`)
		const order = this.plugin.settings.customOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'

		order[oldDir].children = order[oldDir].children.map((path: string) => (path === oldPath ? newPath : path))
		const isFolder = oldPath in order
		if (isFolder) this.renameFolder(oldPath, newPath)

		void this.plugin.saveSettings()
		this.logOrder('Updated order after renaming item:')
	}

	move(oldPath: string, newPath: string, targetSiblingPath: string, position: 'before' | 'after') {
		this.log(`Moving '${oldPath}' to '${newPath}' (${position} '${targetSiblingPath}')`)
		const order = this.plugin.settings.customOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
		const newDir = newPath.substring(0, newPath.lastIndexOf('/')) || '/'
		const isFolder = oldPath in order
		const isDirChanged = oldDir !== newDir

		order[oldDir].children = order[oldDir].children.filter(path => path !== oldPath)

		let insertIdx = 0
		if (targetSiblingPath) {
			const siblingIdx = order[newDir].children.indexOf(targetSiblingPath)
			insertIdx = position === 'before' ? siblingIdx : siblingIdx + 1
		}
		order[newDir].children.splice(insertIdx, 0, newPath)

		if (isFolder) this.renameFolder(oldPath, newPath)

		this.logOrder('Updated order after moving item:')
		if (!isDirChanged) {
			this.log('Directory did not change, calling sort on File Explorer manually')
			getFileExplorerView().sort()
		}
	}

	remove(path: string) {
		this.log(`Removing item: '${path}'`)
		const order = this.plugin.settings.customOrder
		const dir = path.substring(0, path.lastIndexOf('/')) || '/'
		const isFolder = path in order

		order[dir].children = order[dir].children.filter(p => p !== path)
		if (isFolder) delete order[path]

		this.logOrder('Updated order after removing item:')
	}

	reconcileOrder() {
		this.log('Updating order...')
		const currentOrder = this.getCurrentOrder()
		const savedOrder = this.plugin.settings.customOrder
		const newOrder = this.matchSavedOrder(currentOrder, savedOrder)
		this.plugin.settings.customOrder = newOrder
		this.logOrder('Order updated:')
	}

	resetOrder() {
		this.plugin.settings.customOrder = { '/': { children: [], sortOrder: 'custom' } }
	}

	overwriteCustomOrder(folderPath: string) {
		const folderOrder = this.plugin.settings.customOrder[folderPath]
		const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath)
		if (!(folder instanceof TFolder)) return

		folderOrder.children = getFileExplorerView().getSortedFolderItems(folder).map(item => item.file.path)
		folderOrder.sortOrder = 'custom'
		this.log(`Custom order overwritten for '${folderPath}'`)
	}

	private logOrder(message: string) {
		this.log(message, JSON.stringify(this.plugin.settings.customOrder, null, 4), 'group')
	}

	private getCurrentOrder() {
		const currentOrder: FileOrder = {}
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

	private matchSavedOrder(currentOrder: FileOrder, savedOrder: FileOrder) {
		const result: FileOrder = {}

		for (const folder in currentOrder) {
			if (folder in savedOrder) {
				const prevOrder = savedOrder[folder]
				const currentFiles = currentOrder[folder]
				// Leave the files that have already been saved
				const existingFiles = prevOrder.children.filter(file => currentFiles.children.includes(file))
				// Add new files to the beginning of the list
				const newFiles = currentFiles.children.filter(file => !prevOrder.children.includes(file))
				// Combine and remove duplicates
				result[folder] = {
					children: Array.from(this.plugin.settings.newItemPlacement === 'top' ? [...newFiles, ...existingFiles] : [...existingFiles, ...newFiles]),
					sortOrder: prevOrder.sortOrder,
				}
			} else {
				// Remove duplicates from current folder
				result[folder] = { children: Array.from(new Set(currentOrder[folder].children)), sortOrder: 'custom' }
			}
		}

		return result
	}

	private removeFolder(path: string) {
		const order = this.plugin.settings.customOrder
		order[path].children.forEach((childPath: string) => {
			const isFolder = childPath in order
			if (isFolder) this.removeFolder(childPath)
		})
		delete order[path]
	}

	private renameFolder(oldPath: string, newPath: string) {
		if (oldPath === newPath) return
		const order = this.plugin.settings.customOrder
		order[newPath] = order[oldPath]
		delete order[oldPath]
		order[newPath].children = order[newPath].children.map((path: string) => {
			const newChildPath = path.replace(oldPath, newPath)
			const isFolder = path in order
			if (isFolder) this.renameFolder(path, newChildPath)
			return newChildPath
		})
	}
}