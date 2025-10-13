import { Platform, TAbstractFile, TFolder } from 'obsidian'
import type { TreeItem } from 'obsidian-typings'
import Sortable, { type SortableEvent } from 'sortablejs'
import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils/logger'
import { DND_MIN_SWAP_THRESHOLD, DND_MAX_SWAP_THRESHOLD } from '@/constants'

export class DndManager {
	public sortableInstances: Sortable[] = []
	private log = new Logger('dnd-manager', '#7fff65')

	constructor(private plugin: ManualSortingPlugin) {}

	toggleDragging() {
		this.sortableInstances.forEach(sortableInstance =>
			sortableInstance.option('disabled', !this.plugin.settings.draggingEnabled),
		)
	}

	makeSortable(container: HTMLElement) {
		this.log.info(`Initializing Sortable on`, container)

		let origSetCollapsed: TreeItem['setCollapsed'] | null = null

		const sortableInstance = new Sortable(container, {
			group: 'nested',
			draggable: '.tree-item',
			chosenClass: 'manual-sorting-chosen',
			ghostClass: 'manual-sorting-ghost',

			animation: 100,
			swapThreshold: DND_MAX_SWAP_THRESHOLD,
			fallbackOnBody: true,
			disabled: !this.plugin.settings.draggingEnabled,

			delay: 100,
			delayOnTouchOnly: true,

			setData: function (dataTransfer: DataTransfer) {
				dataTransfer.setData('string', 'text/plain')
				dataTransfer.setData('string', 'text/uri-list')
				dataTransfer.effectAllowed = 'all'
			},
			onChoose: (evt: SortableEvent) => {
				this.log.info('Sortable: onChoose')
				const dragged = evt.item
				this.adjustSwapThreshold(dragged, sortableInstance)
			},
			onStart: (evt: SortableEvent) => {
				this.log.info('Sortable: onStart')
				const itemPath = (evt.item.firstChild as HTMLElement | null)?.getAttribute('data-path') || ''
				const itemObject = this.plugin.app.vault.getAbstractFileByPath(itemPath)
				if (itemObject instanceof TFolder) {
					const fileTreeItem = this.plugin.getFileExplorerView().fileItems[itemPath] as TreeItem
					fileTreeItem.setCollapsed(true, true)
					if (!origSetCollapsed) origSetCollapsed = fileTreeItem.setCollapsed.bind(fileTreeItem)
					fileTreeItem.setCollapsed = () => void 0
				}
			},
			onChange: (evt: SortableEvent) => {
				this.log.info('Sortable: onChange')
				const dragged = evt.item
				this.adjustSwapThreshold(dragged, sortableInstance)
			},
			onEnd: (evt: SortableEvent) => this.handleDragEnd(evt, origSetCollapsed),
			onUnchoose: () => {
				this.log.info('Sortable: onUnchoose')
				if (this.plugin.settings.draggingEnabled) {
					try {
						const dropEvent = new DragEvent('drop', {
							bubbles: true,
							cancelable: true,
							dataTransfer: new DataTransfer(),
						})

						document.dispatchEvent(dropEvent)
					} catch {
						// Ignore errors from dispatching drop event
					}
				}
			},
		})
		this.sortableInstances.push(sortableInstance)
	}

	private handleDragEnd(evt: SortableEvent, origSetCollapsed: TreeItem['setCollapsed'] | null) {
		this.log.info('Sortable: onEnd')
		const draggedOverElement = document.querySelector('.is-being-dragged-over')
		const draggedItemPath = (evt.item.firstChild as HTMLElement | null)?.getAttribute('data-path') || ''
		const draggedOverElementPath = (draggedOverElement?.firstChild as HTMLElement | null)?.getAttribute('data-path')
		const destinationPath = draggedOverElementPath || evt.to.previousElementSibling?.getAttribute('data-path') || '/'

		const movedItem = this.plugin.app.vault.getAbstractFileByPath(draggedItemPath)
		if (!movedItem) {
			this.log.warn(`Dragged item not found in vault: ${draggedItemPath}`)
			return
		}
		const targetFolder = this.plugin.app.vault.getFolderByPath(destinationPath)
		const folderPathInItemNewPath = (targetFolder?.isRoot()) ? '' : (destinationPath + '/')
		let itemNewPath = folderPathInItemNewPath + movedItem.name

		if (draggedItemPath !== itemNewPath && this.plugin.app.vault.getAbstractFileByPath(itemNewPath)) {
			this.log.warn(`Name conflict detected. Path: ${itemNewPath} already exists. Resolving...`)

			itemNewPath = this.generateUniqueFilePath(itemNewPath, movedItem, folderPathInItemNewPath)
			this.log.info('New item path:', itemNewPath)
		}

		const newDraggbleIndex = draggedOverElementPath
			? this.plugin.settings.newItemsPosition === 'top' ? 0 : Infinity
			: (typeof evt.newDraggableIndex === 'number' ? evt.newDraggableIndex : 0)
		this.plugin.orderManager.moveFile(draggedItemPath, itemNewPath, newDraggbleIndex)
		void this.plugin.app.fileManager.renameFile(movedItem, itemNewPath)

		const fileExplorerView = this.plugin.getFileExplorerView()

		// Obsidian doesn't automatically call onRename in some cases - needed here to ensure the DOM reflects file structure changes
		if (movedItem.path === itemNewPath) {
			this.log.warn('Calling onRename manually for', movedItem, itemNewPath)
			fileExplorerView.onRename(movedItem, draggedItemPath)
		}

		if (movedItem instanceof TFolder) {
			const fileTreeItem = fileExplorerView.fileItems[draggedItemPath] as TreeItem
			if (origSetCollapsed) fileTreeItem.setCollapsed = origSetCollapsed
		}

		if (!Platform.isMobile) {
			// Manually trigger the tooltip for the dragged item
			const draggedItemSelf = evt.item.querySelector('.tree-item-self')
			if (!draggedItemSelf) return
			const hoverEvent = new MouseEvent('mouseover', { bubbles: true, cancelable: true })
			draggedItemSelf.dispatchEvent(hoverEvent)

			// Simulate hover on the dragged item
			document.querySelector('.tree-item-self.hovered')?.classList.remove('hovered')
			draggedItemSelf.classList.add('hovered')
			draggedItemSelf.addEventListener('mouseleave', () => draggedItemSelf.classList.remove('hovered'), { once: true })
		}
	}

	private adjustSwapThreshold(item: HTMLElement, sortableInstance: Sortable) {
		const previousItem = item.previousElementSibling
		const nextItem = item.nextElementSibling

		const adjacentNavFolders = []
		if (previousItem?.classList.contains('nav-folder')) adjacentNavFolders.push(previousItem)
		if (nextItem?.classList.contains('nav-folder')) adjacentNavFolders.push(nextItem)

		if (adjacentNavFolders.length > 0) {
			sortableInstance.options.swapThreshold = DND_MIN_SWAP_THRESHOLD

			adjacentNavFolders.forEach(navFolder => {
				const childrenContainer = navFolder.querySelector('.tree-item-children')
				if (childrenContainer) this.makeSortable(childrenContainer as HTMLElement)
			})
		} else {
			sortableInstance.options.swapThreshold = DND_MAX_SWAP_THRESHOLD
		}
	}

	private generateUniqueFilePath(path: string, movedItem: TAbstractFile, folderPathInItemNewPath: string): string {
		const fullName = movedItem.name
		const lastDotIndex = fullName.lastIndexOf('.')
		const name = lastDotIndex === -1 ? fullName : fullName.slice(0, lastDotIndex)
		const extension = lastDotIndex === -1 ? '' : fullName.slice(lastDotIndex + 1)
		let revisedPath = path
		let counter = 1

		while (this.plugin.app.vault.getAbstractFileByPath(revisedPath)) {
			const newName = `${name} ${counter}${extension ? '.' + extension : ''}`
			revisedPath = folderPathInItemNewPath + newName
			counter++
		}

		return revisedPath
	}
}