import { TFolder } from 'obsidian'
import { type FileOrder } from '@/types.d'
import ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils/logger'

export class OrderManager {
	private log = new Logger('order-manager', '#ffd900')

	constructor(private plugin: ManualSortingPlugin) {}

	resetOrder() {
		this.plugin.settings.customFileOrder = { '/': [] }
		void this.plugin.saveSettings()
	}

	updateOrder() {
		this.log.info('Updating order...')
		const currentOrder = this.getCurrentOrder()
		const savedOrder = this.plugin.settings.customFileOrder
		const newOrder = this.matchSavedOrder(currentOrder, savedOrder)
		this.plugin.settings.customFileOrder = newOrder
		void this.plugin.saveSettings()
		this.log.info('Order updated:', this.plugin.settings.customFileOrder)
	}

	private getCurrentOrder() {
		const currentData: Record<string, string[]> = {}
		const explorerView = this.plugin.getFileExplorerView()

		const indexFolder = (folder: TFolder) => {
			const sortedItems = explorerView.getSortedFolderItems(folder)
			const sortedItemPaths = sortedItems.map(item => item.file.path)
			currentData[folder.path] = sortedItemPaths

			for (const item of sortedItems) {
				const itemObject = item.file
				if (itemObject instanceof TFolder) {
					indexFolder(itemObject)
				}
			}
		}

		indexFolder(this.plugin.app.vault.root)
		return currentData
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
				result[folder] = Array.from(new Set([...newFiles, ...existingFiles]))
			} else {
				// Remove duplicates from current folder
				result[folder] = Array.from(new Set(currentOrder[folder]))
			}
		}

		return result
	}

	moveFile(oldPath: string, newPath: string, newDraggbleIndex: number) {
		this.log.info(`Moving from "${oldPath}" to "${newPath}" at index ${newDraggbleIndex}`)
		const data = this.plugin.settings.customFileOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
		const newDir = newPath.substring(0, newPath.lastIndexOf('/')) || '/'

		if (oldDir in data) {
			data[oldDir] = data[oldDir].filter((path: string) => path !== oldPath)
		} else {
			this.log.warn(`[moveFile] folder "${oldDir}" not found in data.`)
		}

		if (data[newDir].includes(newPath)) {
			this.log.warn(`[moveFile] "${newPath}" already exists in "${newDir}". Removing it from "${oldDir}" and returning.`)
			return
		}

		data[newDir].splice(newDraggbleIndex, 0, newPath)

		void this.plugin.saveSettings()
	}

	renameItem(oldPath: string, newPath: string) {
		if (oldPath === newPath) return
		this.log.info(`Renaming "${oldPath}" to "${newPath}"`)
		const data = this.plugin.settings.customFileOrder
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'

		if (oldDir in data) {
			data[oldDir] = data[oldDir].map((path: string) => (path === oldPath ? newPath : path))
		} else {
			this.log.warn(`[renameItem] folder "${oldDir}" not found in data.`)
		}

		const itemIsFolder = oldPath in data
		if (itemIsFolder) {
			this.log.info(`[renameItem] "${oldPath}" is a folder. Renaming its children as well.`)
			data[newPath] = data[oldPath]
			delete data[oldPath]
			data[newPath] = data[newPath].map((path: string) => path.replace(oldPath, newPath))
		}

		void this.plugin.saveSettings()
	}

	async restoreOrder(container: Element, folderPath: string) {
		const savedData = this.plugin.settings.customFileOrder
		this.log.info(`Restoring order for "${folderPath}"`)
		const savedOrder = folderPath in savedData ? savedData[folderPath] : null
		if (!savedOrder) return

		const explorer = await this.plugin.waitForExplorer()
		const scrollTop = explorer.scrollTop

		const itemsByPath = new Map<string, Element>()
		Array.from(container.children).forEach((child: Element) => {
			const path = child.firstElementChild?.getAttribute('data-path')
			if (path) {
				itemsByPath.set(path, child)
			}
		})

		const fragment = document.createDocumentFragment()
		savedOrder.forEach((path: string) => {
			const element = itemsByPath.get(path)
			if (element) {
				fragment.appendChild(element)
			}
		})

		container.appendChild(fragment)
		explorer.scrollTop = scrollTop
		this.log.info(`Order restored for "${folderPath}"`)
	}

	getFlattenPaths() {
		function flattenPaths(obj: Record<string, string[]>, path = '/'): string[] {
			const result = []

			if (path in obj) {
				for (const item of obj[path]) {
					result.push(item)
					if (item in obj) {
						result.push(...flattenPaths(obj, item))
					}
				}
			}
			return result
		}

		return flattenPaths(this.plugin.settings.customFileOrder)
	}
}