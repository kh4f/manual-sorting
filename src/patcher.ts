import { Menu, MenuItem, Keymap, TFolder, TAbstractFile, Platform } from 'obsidian'
import type { FileTreeItem, TreeItem, FileExplorerView, InfinityScroll, InfinityScrollRootEl, FolderTreeItem } from 'obsidian-typings'
import { around } from 'monkey-around'
import Sortable, { type SortableEvent, type SortablePrototype } from 'sortablejs'
import { ResetOrderModal } from '@/components'
import { MANUAL_SORTING_MODE_ID } from '@/constants'
import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils/logger'

export class Patcher {
	private explorerUninstallers: ReturnType<typeof around>[] = []
	private menuUninstaller: ReturnType<typeof around> | null = null
	private log = new Logger('patcher', '#65a3ff')

	constructor(private plugin: ManualSortingPlugin) {}

	patchSortable() {
		const patcher = this

		around((Sortable.prototype as SortablePrototype), {
			_onDragOver: original => function (evt: DragEvent) {
				if (!this.el.children.length) {
					patcher.log.warn('Container is empty, skipping onDragOver()')
					return
				}
				return original.call(this, evt)
			},
		})
	}

	patchFileExplorer() {
		const patcher = this
		const plugin = this.plugin
		const fileExplorerView = plugin.getFileExplorerView()

		this.explorerUninstallers.push(
			around(Object.getPrototypeOf((fileExplorerView.tree.infinityScroll.rootEl as InfinityScrollRootEl).childrenEl) as HTMLElement, {
				setChildrenInPlace: original => function (this: HTMLElement, newChildren: HTMLElement[]) {
					const isInExplorer = !!this.closest('[data-type="file-explorer"]')
					const isFileTreeItem = this.classList.value.includes('tree-item') && this.classList.value.includes('nav-')

					if (!plugin.isManualSortingEnabled() || (!isFileTreeItem && !isInExplorer)) {
						original.apply(this, [newChildren])
						return
					}

					const currentChildren = Array.from(this.children)
					const newChildrenSet = new Set(newChildren)

					for (const child of currentChildren) {
						const childElement = child as HTMLElement
						if (!newChildrenSet.has(childElement)) {
							const childPath = (childElement.firstElementChild as HTMLElement | null)?.getAttribute('data-path')
							if (childPath && childElement.classList.contains('tree-item')) {
								// Check if the item still exists in the vault
								const itemObject = plugin.app.vault.getAbstractFileByPath(childPath)
								if (!itemObject) {
									patcher.log.warn('Item not exists in vault, removing its DOM element:', childPath)
									if (childPath) plugin.orderManager.updateOrder()
									this.removeChild(child)
								} else {
									const actualParentPath = childElement.parentElement?.previousElementSibling?.getAttribute('data-path') || '/'
									const itemObjectParentPath = itemObject.parent?.path

									if ((itemObjectParentPath !== actualParentPath) && !plugin.settings.draggingEnabled) {
										patcher.log.warn('Item not in the right place, removing its DOM element:', childPath)
										this.removeChild(childElement)
										// Sync file explorer DOM tree
										const fileExplorerView = plugin.getFileExplorerView()
										fileExplorerView.updateShowUnsupportedFiles()
									}
								}
							}
						}
					}

					const processNewItem = (addedItem: HTMLElement) => {
						const path = (addedItem.firstChild as HTMLElement | null)?.getAttribute('data-path')
						patcher.log.info(`Processing item`, addedItem, path)
						const itemContainer: HTMLElement = this
						const elementFolderPath = path?.substring(0, path.lastIndexOf('/')) || '/'
						patcher.log.info(`Item container:`, itemContainer, elementFolderPath)

						if (plugin.itemBeingCreatedManually) {
							patcher.log.info('Item is being created manually')
							plugin.itemBeingCreatedManually = false
							plugin.orderManager.updateOrder()
						}

						if (itemContainer.classList.contains('all-children-loaded')) {
							patcher.log.warn(`All children already loaded for ${elementFolderPath}. Skipping...`)
							return
						}

						const dataPathValues = Array.from(itemContainer.children)
							.filter(item => item.firstElementChild?.hasAttribute('data-path'))
							.map(item => item.firstElementChild?.getAttribute('data-path'))
						const childrenCount = dataPathValues.length

						const expectedChildrenCount = plugin.app.vault.getFolderByPath(elementFolderPath)?.children.length
						patcher.log.info(`Children count: ${childrenCount}, Expected children count: ${expectedChildrenCount}`)

						if (childrenCount === expectedChildrenCount) {
							itemContainer.classList.add('all-children-loaded')
							patcher.log.warn(`All children loaded for ${elementFolderPath}`)
							void plugin.orderManager.restoreOrder(itemContainer, elementFolderPath)
						}

						const makeSortable = (container: HTMLElement) => {
							if (Sortable.get(container)) return
							patcher.log.info(`Initiating Sortable on`, container)

							const minSwapThreshold = 0.3
							const maxSwapThreshold = 2
							let origSetCollapsed: TreeItem['setCollapsed'] | null = null

							function adjustSwapThreshold(item: HTMLElement) {
								const previousItem = item.previousElementSibling
								const nextItem = item.nextElementSibling

								const adjacentNavFolders = []
								if (previousItem?.classList.contains('nav-folder')) adjacentNavFolders.push(previousItem)
								if (nextItem?.classList.contains('nav-folder')) adjacentNavFolders.push(nextItem)

								if (adjacentNavFolders.length > 0) {
									sortableInstance.options.swapThreshold = minSwapThreshold

									adjacentNavFolders.forEach(navFolder => {
										const childrenContainer = navFolder.querySelector('.tree-item-children')
										if (childrenContainer) makeSortable(childrenContainer as HTMLElement)
									})
								} else {
									sortableInstance.options.swapThreshold = maxSwapThreshold
								}
							}

							const sortableInstance = new Sortable(container, {
								group: 'nested',
								draggable: '.tree-item',
								chosenClass: 'manual-sorting-chosen',
								ghostClass: 'manual-sorting-ghost',

								animation: 100,
								swapThreshold: maxSwapThreshold,
								fallbackOnBody: true,
								disabled: !plugin.settings.draggingEnabled,

								delay: 100,
								delayOnTouchOnly: true,

								setData: function (dataTransfer: DataTransfer) {
									dataTransfer.setData('string', 'text/plain')
									dataTransfer.setData('string', 'text/uri-list')
									dataTransfer.effectAllowed = 'all'
								},
								onChoose: (evt: SortableEvent) => {
									patcher.log.info('Sortable: onChoose')
									const dragged = evt.item
									adjustSwapThreshold(dragged)
								},
								onStart: (evt: SortableEvent) => {
									patcher.log.info('Sortable: onStart')
									const itemPath = (evt.item.firstChild as HTMLElement | null)?.getAttribute('data-path') || ''
									const itemObject = plugin.app.vault.getAbstractFileByPath(itemPath)
									if (itemObject instanceof TFolder) {
										const fileTreeItem = plugin.getFileExplorerView().fileItems[itemPath] as TreeItem
										fileTreeItem.setCollapsed(true, true)
										if (!origSetCollapsed) origSetCollapsed = fileTreeItem.setCollapsed.bind(fileTreeItem)
										fileTreeItem.setCollapsed = () => void 0
									}
								},
								onChange: (evt: SortableEvent) => {
									patcher.log.info('Sortable: onChange')
									const dragged = evt.item
									adjustSwapThreshold(dragged)
								},
								onEnd: (evt: SortableEvent) => {
									patcher.log.info('Sortable: onEnd')
									const draggedOverElement = document.querySelector('.is-being-dragged-over')
									const draggedItemPath = (evt.item.firstChild as HTMLElement | null)?.getAttribute('data-path') || ''
									const draggedOverElementPath = (draggedOverElement?.firstChild as HTMLElement | null)?.getAttribute('data-path')
									const destinationPath = draggedOverElementPath || evt.to.previousElementSibling?.getAttribute('data-path') || '/'

									const movedItem = plugin.app.vault.getAbstractFileByPath(draggedItemPath)
									if (!movedItem) {
										patcher.log.warn(`Dragged item not found in vault: ${draggedItemPath}`)
										return
									}
									const targetFolder = plugin.app.vault.getFolderByPath(destinationPath)
									const folderPathInItemNewPath = (targetFolder?.isRoot()) ? '' : (destinationPath + '/')
									let itemNewPath = folderPathInItemNewPath + movedItem.name

									if (draggedItemPath !== itemNewPath && plugin.app.vault.getAbstractFileByPath(itemNewPath)) {
										patcher.log.warn(`Name conflict detected. Path: ${itemNewPath} already exists. Resolving...`)

										const generateUniqueFilePath = (path: string): string => {
											const fullName = movedItem.name
											const lastDotIndex = fullName.lastIndexOf('.')
											const name = lastDotIndex === -1 ? fullName : fullName.slice(0, lastDotIndex)
											const extension = lastDotIndex === -1 ? '' : fullName.slice(lastDotIndex + 1)
											let revisedPath = path
											let counter = 1

											while (plugin.app.vault.getAbstractFileByPath(revisedPath)) {
												const newName = `${name} ${counter}${extension ? '.' + extension : ''}`
												revisedPath = folderPathInItemNewPath + newName
												counter++
											}

											return revisedPath
										}

										itemNewPath = generateUniqueFilePath(itemNewPath)
										patcher.log.info('New item path:', itemNewPath)
									}

									const newDraggbleIndex = draggedOverElementPath
										? plugin.settings.newItemsPosition === 'top' ? 0 : Infinity
										: (typeof evt.newDraggableIndex === 'number' ? evt.newDraggableIndex : 0)
									plugin.orderManager.moveFile(draggedItemPath, itemNewPath, newDraggbleIndex)
									void plugin.app.fileManager.renameFile(movedItem, itemNewPath)

									const fileExplorerView = plugin.getFileExplorerView()

									// Obsidian doesn't automatically call onRename in some cases - needed here to ensure the DOM reflects file structure changes
									if (movedItem.path === itemNewPath) {
										patcher.log.warn('Calling onRename manually for', movedItem, itemNewPath)
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
								},
								onUnchoose: () => {
									patcher.log.info('Sortable: onUnchoose')
									if (plugin.settings.draggingEnabled) {
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
							plugin.sortableInstances.push(sortableInstance)
						}
						makeSortable(itemContainer)
					}

					for (const child of newChildren) {
						if (!this.contains(child)) {
							if (child.classList.contains('tree-item')) {
								// Fix #43: Obsidian has a top div in each .tree-item container to maintain correct scroll height
								// so we leave it in place and insert the new item below it
								const topmostTreeItem: HTMLElement | null = this.querySelector('.tree-item')
								if (plugin.settings.newItemsPosition === 'top') this.insertBefore(child, topmostTreeItem)
								else this.append(child)

								if (!(child.firstChild as HTMLElement | null)?.hasAttribute('data-path')) {
									new MutationObserver((mutations, obs) => {
										for (const mutation of mutations) {
											if (mutation.attributeName === 'data-path') {
												processNewItem(child)
												obs.disconnect()
												return
											}
										}
									}).observe(child.firstChild as Node, { attributes: true, attributeFilter: ['data-path'] })
								} else {
									processNewItem(child)
								}
							} else {
								this.prepend(child)
							}
						}
					}
				},
				detach: original => function (this: HTMLElement) {
					if (!plugin.isManualSortingEnabled()) {
						original.apply(this)
						return
					}
					const firstChild = this.firstChild
					const path = (firstChild instanceof HTMLElement) ? firstChild.getAttribute('data-path') : ''
					const itemObject = plugin.app.vault.getAbstractFileByPath(path || '')

					// Prevent detaching of existing items
					if (!itemObject) {
						original.apply(this)
						return
					}
				},
			}),
		)

		this.explorerUninstallers.push(
			around(Object.getPrototypeOf(fileExplorerView) as FileExplorerView, {
				onRename: original => function (this: FileExplorerView, file: TAbstractFile, oldPath: string) {
					original.apply(this, [file, oldPath])
					if (plugin.isManualSortingEnabled()) {
						const oldDirPath = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
						if (!plugin.settings.draggingEnabled && oldDirPath !== file.parent?.path) {
							plugin.orderManager.moveFile(oldPath, file.path, plugin.settings.newItemsPosition === 'top' ? 0 : Infinity)
						}
						plugin.orderManager.renameItem(oldPath, file.path)
					}
				},
				setSortOrder: original => function (this: FileExplorerView, sortOrder: string) {
					// this method is called only when selecting one of the standard sorting modes
					original.call(this, sortOrder)
					const prevManualSortingEnabledStatus = plugin.isManualSortingEnabled()
					plugin.settings.selectedSortOrder = sortOrder

					patcher.log.info('Sort order changed to:', sortOrder)
					if (prevManualSortingEnabledStatus) void plugin.reloadExplorerPlugin()
					void plugin.saveSettings()
				},
				sort: original => function (this: FileExplorerView) {
					if (plugin.isManualSortingEnabled()) plugin.recentExplorerAction = 'sort'
					original.apply(this)
				},
				onFileMouseover: original => function (this: FileExplorerView, event: MouseEvent, targetEl: HTMLElement) {
					if (plugin.isManualSortingEnabled()) {
						// Set targetEl to the dragging element if it exists to ensure the tooltip is shown correctly
						const draggingElement = document.querySelector('.manual-sorting-chosen')
						if (draggingElement) targetEl = draggingElement as HTMLElement
					}
					original.apply(this, [event, targetEl])
				},
			}),
		)

		this.explorerUninstallers.push(
			around(Object.getPrototypeOf(fileExplorerView.tree) as FileExplorerView['tree'], {
				setFocusedItem: original => function (this: FileExplorerView['tree'], node: FileTreeItem | FolderTreeItem, scrollIntoView?: boolean) {
					if (plugin.isManualSortingEnabled()) plugin.recentExplorerAction = 'setFocusedItem'
					original.apply(this, [node, scrollIntoView])
				},
				handleItemSelection: original => function (this: FileExplorerView['tree'], e: PointerEvent, t: FileTreeItem | FolderTreeItem) {
					if (!plugin.isManualSortingEnabled()) {
						original.apply(this, [e, t])
						return
					}

					function getItemsBetween(allPaths: string[], path1: string, path2: string) {
						const index1 = allPaths.indexOf(path1)
						const index2 = allPaths.indexOf(path2)

						if (index1 === -1 || index2 === -1) return []

						const startIndex = Math.min(index1, index2)
						const endIndex = Math.max(index1, index2)

						return allPaths.slice(startIndex, endIndex + 1).map(path =>
							plugin.getFileExplorerView().fileItems[path],
						)
					}

					const n = this,
						i = n.selectedDoms,
						r = n.activeDom,
						o = n.view
					if (!Keymap.isModEvent(e)) {
						if (e.altKey && !e.shiftKey)
							return this.app.workspace.setActiveLeaf(o.leaf, {
								focus: !0,
							}),
							i.has(t)
								? this.deselectItem(t)
								: (this.selectItem(t),
								this.setFocusedItem(t, !1),
								this.activeDom = t),
							!0
						if (e.shiftKey) {
							this.app.workspace.setActiveLeaf(o.leaf, {
								focus: !0,
							})
							const flattenPaths = plugin.orderManager.getFlattenPaths()
							const itemsBetween = r ? getItemsBetween(flattenPaths, r.file.path, t.file.path) : [t]
							for (let a = 0, s = itemsBetween; a < s.length; a++) {
								const l = s[a]
								this.selectItem(l)
							}
							return !0
						}
						if (t.selfEl.hasClass('is-being-renamed')) return !0
						if (t.selfEl.hasClass('is-active'))
							return this.app.workspace.setActiveLeaf(o.leaf, {
								focus: !0,
							}),
							this.setFocusedItem(t, !1),
							!0
					}
					return this.clearSelectedDoms(),
					this.setFocusedItem(undefined as unknown as FileTreeItem | FolderTreeItem),
					this.activeDom = t,
					!1
				},
			}),
		)

		this.explorerUninstallers.push(
			around(Object.getPrototypeOf(fileExplorerView.tree.infinityScroll) as InfinityScroll, {
				scrollIntoView: original => function (this: InfinityScroll, target: { el: HTMLElement }, ...args: unknown[]) {
					const targetElement = target.el
					const isInExplorer = !!targetElement.closest('[data-type="file-explorer"]')

					if (!plugin.isManualSortingEnabled() || !isInExplorer) {
						original.apply(this, [target, ...args])
						return
					}

					if (plugin.recentExplorerAction) {
						plugin.recentExplorerAction = ''
						return
					}

					const container = this.scrollEl
					const offsetTop = targetElement.offsetTop - container.offsetTop
					const middleAlign = offsetTop - (container.clientHeight * 0.3) + (targetElement.clientHeight / 2)

					container.scrollTo({ top: middleAlign, behavior: 'smooth' })
				},
			}),
		)
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
					if (plugin.isManualSortingEnabled()) {
						const checkedItem = menu.items.find((item): item is MenuItem => item instanceof MenuItem && item.checked === true)
						if (checkedItem) checkedItem.setChecked(false)
					}

					const sortingMenuSection = MANUAL_SORTING_MODE_ID
					menu.addItem((item: MenuItem) => {
						item.setTitle('Manual sorting')
							.setIcon('pin')
							.setChecked(plugin.isManualSortingEnabled())
							.setSection(sortingMenuSection)
							.onClick(() => {
								if (!plugin.isManualSortingEnabled()) {
									plugin.settings.selectedSortOrder = MANUAL_SORTING_MODE_ID
									void plugin.saveSettings()
									plugin.orderManager.updateOrder()
									void plugin.reloadExplorerPlugin()
								}
							})
					})
					if (plugin.isManualSortingEnabled()) {
						menu.addItem((item: MenuItem) => {
							item.setTitle('Dragging')
								.setIcon('move')
								.setSection(sortingMenuSection)
								.onClick(() => {
									plugin.settings.draggingEnabled = !plugin.settings.draggingEnabled
									void plugin.saveSettings()
									plugin.toggleDragging()
								})

							const checkboxContainerEl = item.dom.createEl('div', { cls: 'menu-item-icon dragging-enabled-checkbox' })
							const checkboxEl = checkboxContainerEl.createEl('input', { type: 'checkbox' })
							checkboxEl.checked = plugin.settings.draggingEnabled
						})
					}
					menu.addItem((item: MenuItem) => {
						item.setTitle('Reset order')
							.setIcon('trash-2')
							.setSection(sortingMenuSection)
							.onClick(() => {
								const fileExplorerView = plugin.getFileExplorerView()
								const prevSelectedSortOrder = fileExplorerView.sortOrder
								new ResetOrderModal(plugin.app, prevSelectedSortOrder, () => {
									plugin.orderManager.resetOrder()
									plugin.orderManager.updateOrder()
									if (plugin.isManualSortingEnabled()) void plugin.reloadExplorerPlugin()
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

	unpatchFileExplorer() {
		if (!this.explorerUninstallers.length) return
		this.explorerUninstallers.forEach(uninstall => uninstall())
		this.explorerUninstallers = []
		this.log.info('File explorer unpatched')
	}

	unpatchSortOrderMenu() {
		if (!this.menuUninstaller) return
		this.menuUninstaller()
		this.menuUninstaller = null
		this.log.info('Sort order menu unpatched')
	}
}