import { TAbstractFile, TFolder } from 'obsidian'
import { type FileOrder } from '@/types'
import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils'

export class OrderManager {
	private log = new Logger('ORDER-MANAGER', '#00ccff')

	constructor(private plugin: ManualSortingPlugin) { }

	private isPathIgnored(path: string): boolean {
		if (this.plugin.settings.ignorePaths[path]) {
			this.log.info(`Path '${path}' is explicitly ignored`)
			return true
		}

		const parts = path.split('/').filter(part => part)
		let currentPath = ''

		for (const part of parts) {
			currentPath = currentPath ? `${currentPath}/${part}` : part
			if (this.plugin.settings.ignorePaths[currentPath]) {
				this.log.info(`Path '${path}' is ignored because parent '${currentPath}' is ignored`)
				return true
			}
		}

		return false
	}

	add(item: TAbstractFile) {
		const path = item.path
		this.log.info(`Inserting new item: '${path}'`)
		const order = this.plugin.settings.customOrder
		const dir = path.substring(0, path.lastIndexOf('/')) || '/'
		const isFolder = item instanceof TFolder
		const insertPos = this.plugin.settings.newItemPlacement

		if (this.isPathIgnored(dir)) return
		if (isFolder) order[path] = { children: [], sortOrder: 'custom' }
		if (insertPos === 'top') order[dir].children.unshift(path)
		else order[dir].children.push(path)

		this.logOrder('Updated order after adding new item:')
	}

	rename(oldPath: string, newPath: string) {
		this.log.info(`Renaming '${oldPath}' to '${newPath}'`)
		const order = this.plugin.settings.customOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
		const newDir = newPath.substring(0, newPath.lastIndexOf('/')) || '/'

		if (!this.isPathIgnored(oldDir)) {
			order[oldDir].children = order[oldDir].children.map((path: string) => (path === oldPath ? newPath : path))
		}

		const isFolder = oldPath in order
		if (isFolder) this.renameFolder(oldPath, newPath)

		if (this.isPathIgnored(newDir) && typeof order[newDir] !== 'undefined') {
			order[newDir].children = order[newDir].children.filter((path: string) => path !== newPath)
		}

		this.logOrder('Updated order after renaming item:')
	}

	move(oldPath: string, newPath: string, targetSiblingPath: string, position: 'before' | 'after') {
		this.log.info(`Moving '${oldPath}' to '${newPath}' (${position} '${targetSiblingPath}')`)
		const order = this.plugin.settings.customOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
		const newDir = newPath.substring(0, newPath.lastIndexOf('/')) || '/'
		const isFolder = oldPath in order
		const isDirChanged = oldDir !== newDir

		const oldDirIgnored = this.isPathIgnored(oldDir)

		if (!oldDirIgnored) {
			order[oldDir].children = order[oldDir].children.filter(path => path !== oldPath)
		}

		let insertIdx = 0
		if (!this.isPathIgnored(newDir) && targetSiblingPath) {
			const siblingIdx = order[newDir].children.indexOf(targetSiblingPath)
			insertIdx = position === 'before' ? siblingIdx : siblingIdx + 1
			order[newDir].children.splice(insertIdx, 0, newPath)
		}

		if (isFolder && !oldDirIgnored) this.renameFolder(oldPath, newPath)

		this.logOrder('Updated order after moving item:')
		if (oldDir === newDir && !isDirChanged) {
			this.log.info('Directory did not change, calling sort on File Explorer manually')
			this.plugin.getFileExplorerView().sort()
		}
	}

	remove(path: string) {
		this.log.info(`Removing item: '${path}'`)
		const order = this.plugin.settings.customOrder
		const dir = path.substring(0, path.lastIndexOf('/')) || '/'
		const isFolder = path in order

		order[dir].children = order[dir].children.filter(p => p !== path)
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
		this.plugin.settings.customOrder = { '/': { children: [], sortOrder: 'custom' } }
	}

	private logOrder(message: string) {
		this.log.infoCompact(message, JSON.stringify(this.plugin.settings.customOrder, null, 4))
	}

	private getCurrentOrder() {
		const currentOrder: FileOrder = {}
		const explorerView = this.plugin.getFileExplorerView()

		const indexFolder = (folder: TFolder) => {
			if (this.isPathIgnored(folder.path)) return

			const sortedItems = explorerView.getSortedFolderItems(folder, true)
			const sortedItemPaths = sortedItems.map(item => item.file.path)
			currentOrder[folder.path] = { children: sortedItemPaths, sortOrder: 'custom' }

			for (const item of sortedItems) {
				const itemObject = item.file
				if (itemObject instanceof TFolder) {
					if (this.isPathIgnored(itemObject.path)) continue
					indexFolder(itemObject)
				}
			}
		}

		indexFolder(this.plugin.app.vault.root)
		return currentOrder
	}

	private matchSavedOrder(currentOrder: FileOrder, savedOrder: FileOrder) {
		const result: FileOrder = {}

		for (const folder in currentOrder) {
			if (this.isPathIgnored(folder)) continue
			if (folder in savedOrder) {
				const prevOrder = savedOrder[folder]
				const currentFiles = currentOrder[folder]
				// Leave the files that have already been saved
				const existingFiles = prevOrder.children.filter(file => currentFiles.children.includes(file))
				// Add new files to the beginning of the list
				const newFiles = currentFiles.children.filter(file => !prevOrder.children.includes(file))
				// Combine and remove duplicates
				if (this.plugin.settings.newItemPlacement === 'top') {
					result[folder] = { children: Array.from(new Set([...newFiles, ...existingFiles])), sortOrder: 'custom' }
				} else {
					result[folder] = { children: Array.from(new Set([...existingFiles, ...newFiles])), sortOrder: 'custom' }
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