import { Platform, TFile, TFolder } from 'obsidian'
import type { FileTreeItem, FolderTreeItem } from 'obsidian-typings'
import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils'

export class DndManager {
	private log = new Logger('dnd-manager', '#7fff65')
	private explorerEl: HTMLElement | null = null
	private dragStartHandler: ((e: DragEvent | TouchEvent) => void) | null = null
	private dragStartEventType: 'dragstart' | 'touchstart' = Platform.isMobile ? 'touchstart' : 'dragstart'
	private dragEventType: 'drag' | 'touchmove' = Platform.isMobile ? 'touchmove' : 'drag'
	private dropEventType: 'dragend' | 'touchend' = Platform.isMobile ? 'touchend' : 'dragend'
	private rafId = 0

	constructor(private plugin: ManualSortingPlugin) {}

	async enable() {
		this.explorerEl = await this.plugin.explorerManager.waitForExplorerElement(true)

		let futureSibling: HTMLElement
		let dropPosition: 'before' | 'after'

		this.dragStartHandler = e => {
			const draggedEl = e.target as HTMLElement
			const pointer = e instanceof DragEvent ? e : e.touches[0]
			const distanceFromRight = draggedEl.getBoundingClientRect().right - pointer.clientX
			if (Platform.isMobile && distanceFromRight > 25) return

			const onDrag = (e: DragEvent | TouchEvent) => {
				// prevents horizontal swipe gesture from closing the explorer on mobile
				if (Platform.isMobile) e.stopPropagation()
				cancelAnimationFrame(this.rafId)
				this.rafId = requestAnimationFrame(() => {
					const target = e.target as HTMLElement
					const pointer = e instanceof DragEvent ? e : e.touches[0]
					target.dataset.isBeingDragged = ''
					this.collapseHoveredFolder(target)
					;({ futureSibling, dropPosition } = this.findDropTarget(this.explorerEl!, pointer.clientY))
					this.updateDropIndicators(futureSibling, dropPosition)
				})
			}

			const onDrop = () => {
				cancelAnimationFrame(this.rafId)
				draggedEl.removeEventListener(this.dragEventType, onDrag)
				this.clearDropIndicators()

				const sourcePath = draggedEl.dataset.path!
				const item = this.plugin.getFileExplorerView().fileItems[sourcePath]

				const siblingPath = futureSibling.querySelector<HTMLElement>('.tree-item-self')?.dataset.path ?? ''
				const isSiblingTempChild = futureSibling.classList.contains('temp-child')

				this.plugin.orderManager.reconcileOrder()

				const selectedItems = this.plugin.getFileExplorerView().tree.selectedDoms
				if (selectedItems.has(item)) {
					this.moveSelectedItems(selectedItems, siblingPath, isSiblingTempChild, dropPosition)
				} else {
					this.moveItem(item, siblingPath, dropPosition, isSiblingTempChild)
				}
			}

			draggedEl.addEventListener(this.dragEventType, onDrag)
			draggedEl.addEventListener(this.dropEventType, onDrop, { once: true })
		}

		this.explorerEl.addEventListener(this.dragStartEventType, this.dragStartHandler)

		this.log.info('Drag and drop enabled')
	}

	disable() {
		if (this.explorerEl && this.dragStartHandler) {
			this.explorerEl.removeEventListener(this.dragStartEventType, this.dragStartHandler)
			this.log.info('Drag and drop disabled')
		}
	}

	private collapseHoveredFolder(target: HTMLElement) {
		const isFolder = target.classList.contains('nav-folder-title')
		if (isFolder && target.dataset.path) {
			const file = this.plugin.getFileExplorerView().fileItems[target.dataset.path]
			if (!file.collapsed) file.setCollapsed(true, true)
		}
	}

	private findDropTarget(explorerEl: HTMLElement, mouseY: number): { futureSibling: HTMLElement, dropPosition: 'before' | 'after' } {
		const treeItems = Array.from(explorerEl.querySelectorAll(
			'[data-type="file-explorer"] > .nav-files-container > div > .tree-item, \
			.nav-folder:not(:has(> [data-is-being-dragged])) .tree-item',
		))
		if (!treeItems.length) return { futureSibling: treeItems[0] as HTMLElement, dropPosition: 'before' }

		let futureSibling = treeItems[0] as HTMLElement
		let dropPosition: 'before' | 'after' = treeItems[0].matches('.tree-item:nth-child(1 of .tree-item)') ? 'before' : 'after'

		treeItems.forEach(item => {
			const isTempChild = item.classList.contains('temp-child')
			const itemRect = item.getBoundingClientRect()
			const itemTop = itemRect.top
			let itemBottom = itemRect.bottom
			if (item.matches('.tree-item-children .tree-item:nth-last-child(1 of .tree-item)')) itemBottom -= 0.01
			const futureSiblingEdgeY = futureSibling.getBoundingClientRect()[dropPosition === 'before' ? 'top' : 'bottom']
			const futureSiblingDist = Math.abs(futureSiblingEdgeY - mouseY)
			const itemBottomDist = Math.abs(itemBottom - mouseY)
			if ((itemBottomDist < futureSiblingDist) && !isTempChild)
				[futureSibling, dropPosition] = [item as HTMLElement, 'after']
			if (item.matches('.tree-item:nth-child(1 of .tree-item)')) {
				const itemTopDist = Math.abs(itemTop - mouseY)
				if (itemTopDist < futureSiblingDist && itemTopDist < itemBottomDist)
					[futureSibling, dropPosition] = [item as HTMLElement, 'before']
			}
		})

		return { futureSibling, dropPosition }
	}

	private updateDropIndicators(futureSibling: HTMLElement, dropPosition: 'before' | 'after') {
		document.querySelectorAll('.tree-item[data-drop-position]').forEach(el => el.removeAttribute('data-drop-position'))
		futureSibling.dataset.dropPosition = dropPosition
		const siblingPath = futureSibling.querySelector<HTMLElement>('.tree-item-self')?.dataset.path ?? ''

		if (Platform.isMobile && ['nav-folder', 'is-collapsed'].every(cls => futureSibling.classList.contains(cls))) {
			const item = this.plugin.getFileExplorerView().fileItems[siblingPath]
			item.setCollapsed(false, true)
		}

		const childrenContainer = futureSibling.querySelector('.tree-item-children')
		if (childrenContainer && !childrenContainer.children.length) {
			const tempChild = Object.assign(document.createElement('div'), {
				className: 'tree-item temp-child',
				innerHTML: `<div class="tree-item-self temp" data-path="${siblingPath}/temp"></div>`,
			})
			childrenContainer.appendChild(tempChild)
		}

		document.querySelectorAll('.nav-folder.is-drop-target').forEach(el => el.classList.remove('is-drop-target'))
		const parentFolder = futureSibling.parentElement!.closest('.nav-folder, [data-type="file-explorer"] > .nav-files-container > div')
		if (parentFolder) parentFolder.classList.add('is-drop-target')
	}

	private clearDropIndicators() {
		document.querySelectorAll('[data-is-being-dragged]').forEach(el => el.removeAttribute('data-is-being-dragged'))
		document.querySelectorAll('[data-drop-position]').forEach(el => el.removeAttribute('data-drop-position'))
		document.querySelectorAll('.is-drop-target').forEach(el => el.classList.remove('is-drop-target'))
		document.querySelectorAll('.temp-child').forEach(el => el.remove())
	}

	private moveItem(item: FileTreeItem | FolderTreeItem, siblingPath: string, dropPosition: 'before' | 'after', isSiblingTempChild?: boolean): string {
		const file = item.file
		const sourcePath = file.path

		const targetFolderPath = siblingPath.substring(0, siblingPath.lastIndexOf('/'))
		let targetPath = targetFolderPath ? targetFolderPath + '/' + file.name : file.name

		const isDuplicateExists = sourcePath !== targetPath && !!this.plugin.app.vault.getAbstractFileByPath(targetPath)
		if (isDuplicateExists) {
			const basePath = file instanceof TFile ? targetPath.slice(0, -(file.extension.length + 1)) : targetPath
			targetPath = this.plugin.app.vault.getAvailablePath(basePath, file instanceof TFile ? file.extension : '')
		}

		this.log.info(`Moving '${sourcePath}' to '${targetPath}' (${dropPosition} '${siblingPath}')`)

		void this.plugin.app.fileManager.renameFile(file, targetPath)
		this.plugin.getFileExplorerView().lastDropTargetEl = item.el

		if (isSiblingTempChild) siblingPath = ''
		const isItemMoved = this.plugin.orderManager.move(sourcePath, targetPath, siblingPath, dropPosition)
		if (isItemMoved) void this.plugin.saveSettings()

		return targetPath
	}

	private moveSelectedItems(selectedItems: Set<FileTreeItem | FolderTreeItem>, siblingPath: string, isSiblingTempChild: boolean, dropPosition: 'before' | 'after') {
		let filteredItems = Array.from(selectedItems)
		const areFolderInSelection = filteredItems.some(item => item.file instanceof TFolder)
		if (areFolderInSelection) {
			// filter out selected files inside selected folders
			filteredItems = filteredItems.filter(item => {
				if (item.file instanceof TFolder) return true
				const file = item.file
				return !filteredItems.some(item => item.file instanceof TFolder && file.path.startsWith(item.file.path + '/'))
			})
		}
		filteredItems = filteredItems.sort((a, b) => {
			const elA = a.el, elB = b.el
			if (elA.compareDocumentPosition(elB) & Node.DOCUMENT_POSITION_FOLLOWING) return -1
			if (elA.compareDocumentPosition(elB) & Node.DOCUMENT_POSITION_PRECEDING) return 1
			return 0
		})

		filteredItems.forEach((item, index) => {
			if (index > 0) {
				dropPosition = 'after'
				isSiblingTempChild = false
			}
			siblingPath = this.moveItem(item, siblingPath, dropPosition, isSiblingTempChild)
		})
	}
}