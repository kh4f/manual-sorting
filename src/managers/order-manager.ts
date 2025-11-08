import { TAbstractFile, TFolder } from 'obsidian'
import { type FileOrder } from '@/types.d'
import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils'

export class OrderManager {
	private log = new Logger('order-manager', '#ffd900')

	constructor(private plugin: ManualSortingPlugin) {}

	add(item: TAbstractFile) {
		const path = item.path
		this.log.info(`Inserting new item: ${path}`)
		const order = this.plugin.settings.customOrder
		const dir = path.substring(0, path.lastIndexOf('/')) || '/'
		const isFolder = item instanceof TFolder
		const insertPos = this.plugin.settings.newItemPlacement

		if (isFolder) order[path] = []
		if (insertPos === 'top') order[dir].unshift(path)
		else order[dir].push(path)

		this.logOrder('Updated order after adding new item:')
	}

	rename(oldPath: string, newPath: string) {
		this.log.info(`Renaming '${oldPath}' to '${newPath}'`)
		const order = this.plugin.settings.customOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'

		order[oldDir] = order[oldDir].map((path: string) => (path === oldPath ? newPath : path))
		const isFolder = oldPath in order
		if (isFolder) this.renameFolder(oldPath, newPath)

		this.logOrder('Updated order after renaming item:')
	}

	move(oldPath: string, newPath: string, targetSiblingPath: string, position: 'before' | 'after'): boolean {
		if (oldPath === newPath && newPath === targetSiblingPath) return false
		this.log.info(`Inserting ${oldPath} to ${newPath} (${position} ${targetSiblingPath})`)
		const order = this.plugin.settings.customOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
		const newDir = newPath.substring(0, newPath.lastIndexOf('/')) || '/'
		const isFolder = oldPath in order
		const isDirChanged = oldDir !== newDir

		order[oldDir] = order[oldDir].filter(path => path !== oldPath)

		let insertIdx = 0
		if (targetSiblingPath) {
			const siblingIdx = order[newDir].indexOf(targetSiblingPath)
			insertIdx = position === 'before' ? siblingIdx : siblingIdx + 1
		}
		order[newDir].splice(insertIdx, 0, newPath)

		if (isFolder) this.renameFolder(oldPath, newPath)

		this.logOrder('Updated order after moving item:')
		if (!isDirChanged) {
			this.log.info('Directory did not change, calling sort on File Explorer manually')
			this.plugin.getFileExplorerView().sort()
		}

		return true
	}

	remove(path: string) {
		this.log.info(`Removing item: ${path}`)
		const order = this.plugin.settings.customOrder
		const dir = path.substring(0, path.lastIndexOf('/')) || '/'
		const isFolder = path in order

		order[dir] = order[dir].filter(p => p !== path)
		if (isFolder) delete order[path]

		this.logOrder('Updated order after removing item:')
	}

	reconcileOrder() {
		this.log.info('Updating order...')
		const currentOrder = this.getCurrentOrder()
		const savedOrder = this.plugin.settings.customOrder
		const newOrder = this.matchSavedOrder(currentOrder, savedOrder)
		this.plugin.settings.customOrder = newOrder
		this.logOrder('Order updated:')
	}

	resetOrder() {
		this.plugin.settings.customOrder = { '/': [] }
	}

	private logOrder(message: string) {
		this.log.infoCompact(message, JSON.stringify(this.plugin.settings.customOrder, null, 4))
	}

	private getCurrentOrder() {
		const currentOrder: Record<string, string[]> = {}
		const explorerView = this.plugin.getFileExplorerView()

		const indexFolder = (folder: TFolder) => {
			const sortedItems = explorerView.getSortedFolderItems(folder, true)
			const sortedItemPaths = sortedItems.map(item => item.file.path)
			currentOrder[folder.path] = sortedItemPaths

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
				const existingFiles = prevOrder.filter(file => currentFiles.includes(file))
				// Add new files to the beginning of the list
				const newFiles = currentFiles.filter(file => !prevOrder.includes(file))
				// Combine and remove duplicates
				if (this.plugin.settings.newItemPlacement === 'top') {
					result[folder] = Array.from(new Set([...newFiles, ...existingFiles]))
				} else {
					result[folder] = Array.from(new Set([...existingFiles, ...newFiles]))
				}
			} else {
				// Remove duplicates from current folder
				result[folder] = Array.from(new Set(currentOrder[folder]))
			}
		}

		return result
	}

	private removeFolder(path: string) {
		const order = this.plugin.settings.customOrder
		order[path].forEach((childPath: string) => {
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
		order[newPath] = order[newPath].map((path: string) => {
			const newChildPath = path.replace(oldPath, newPath)
			const isFolder = path in order
			if (isFolder) this.renameFolder(path, newChildPath)
			return newChildPath
		})
	}
}