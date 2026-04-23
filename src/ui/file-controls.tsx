import { createRoot } from 'react-dom/client'
import { useState, useRef } from 'react'
import { TFolder, type TAbstractFile } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import type { FolderSettings, ItemSettings, SortOrder as StoredSortOrder } from '@/types'
import { getFileExplorerView, log, cn } from '@/utils'
import { CustomOrderIcon, CheckIcon, FileNameIcon, ModifiedTimeIcon, CreatedTimeIcon, PinIcon, HideIcon } from '@/ui/icons'

type PickerOrder = 'custom' | 'filename' | 'modified' | 'created'
type SortDirection = 'asc' | 'desc'

const isFolderSettings = (item: ItemSettings | undefined): item is FolderSettings => !!item && 'children' in item
const getDefaultItemSettings = () => ({ pinned: false, hidden: false })

const ensureFolderSettings = (plugin: ManualSortingPlugin, path: string) => {
	const item = plugin.settings.items[path]
	if (isFolderSettings(item)) return item

	const folderSettings: FolderSettings = {
		pinned: item ? item.pinned : false,
		hidden: item ? item.hidden : false,
		children: [],
		sortOrder: 'custom',
	}
	plugin.settings.items[path] = folderSettings
	return folderSettings
}

const getPickerOrder = (sortOrder: StoredSortOrder): PickerOrder => {
	switch (sortOrder) {
		case 'alphabetical':
		case 'alphabeticalReverse': return 'filename'
		case 'byModifiedTime':
		case 'byModifiedTimeReverse': return 'modified'
		case 'byCreatedTime':
		case 'byCreatedTimeReverse': return 'created'
		default: return 'custom'
	}
}

const getPickerDirection = (sortOrder: StoredSortOrder): SortDirection => {
	switch (sortOrder) {
		case 'alphabeticalReverse':
		case 'byModifiedTimeReverse':
		case 'byCreatedTimeReverse': return 'desc'
		default: return 'asc'
	}
}

const toStoredSortOrder = (order: PickerOrder, direction: SortDirection): StoredSortOrder => {
	switch (order) {
		case 'filename': return direction === 'asc' ? 'alphabetical' : 'alphabeticalReverse'
		case 'modified': return direction === 'asc' ? 'byModifiedTime' : 'byModifiedTimeReverse'
		case 'created': return direction === 'asc' ? 'byCreatedTime' : 'byCreatedTimeReverse'
		default: return 'custom'
	}
}

export const mountFileControls = (root: HTMLElement, file: TAbstractFile, plugin: ManualSortingPlugin) => {
	createRoot(root).render(file.path === '/'
		? <RootFolderControls file={file} plugin={plugin}/>
		: <FileControls file={file} plugin={plugin}/>)
	log(`File controls mounted for '${file.path}':`, root)
	root.addEventListener('click', e => e.stopImmediatePropagation(), true)
}

const FileControls = ({ file, plugin }: { file: TAbstractFile, plugin: ManualSortingPlugin }) => {
	return <>
		<SortOrderControls file={file} plugin={plugin}/>
		<PinHideControls file={file} plugin={plugin}/>
	</>
}

const RootFolderControls = ({ file, plugin }: { file: TAbstractFile, plugin: ManualSortingPlugin }) => {
	return <>
		<SortOrderControls file={file} plugin={plugin}/>
		<div className='separator'></div>
		<ShowHiddenControls plugin={plugin}/>
	</>
}

const ShowHiddenControls = ({ plugin }: { plugin: ManualSortingPlugin }) => {
	const [showHidden, setShowHidden] = useState(plugin.settings.showHidden)

	const handleToggle = async (e: React.MouseEvent) => {
		e.stopPropagation()
		const nextShowHidden = !showHidden
		setShowHidden(nextShowHidden)
		plugin.settings.showHidden = nextShowHidden
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
		log(`Show hidden files changed to '${nextShowHidden}'`)
	}

	return <div className='show-hidden-controls'>
		<button
			type='button'
			className={cn(showHidden && 'selected')}
			aria-label='Show hidden files'
			onClickCapture={e => void handleToggle(e)}
		><HideIcon/></button>
	</div>
}

const SortOrderControls = ({ file, plugin }: { file: TAbstractFile, plugin: ManualSortingPlugin }) => {
	const isFolder = file instanceof TFolder
	const itemSettings = plugin.settings.items[file.path]
	const folderSettings = isFolderSettings(itemSettings) ? itemSettings : null
	const [sortOrder, setSortOrder] = useState<StoredSortOrder>(
		isFolder && folderSettings ? folderSettings.sortOrder : 'custom',
	)
	const [checkState, setCheckState] = useState<'hidden' | 'visible' | 'fading'>('hidden')
	const holdTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const overwriteTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const startTimeRef = useRef<number>(0)
	const hideTimeoutFadeRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const ignoreCustomClickRef = useRef(false)
	const order = getPickerOrder(sortOrder)
	const direction = getPickerDirection(sortOrder)

	const fadeOutCheck = () => {
		setCheckState('fading')
		hideTimeoutFadeRef.current = setTimeout(() => setCheckState('hidden'), 300)
	}

	const updateFolderSortOrder = async (nextSortOrder: StoredSortOrder) => {
		const folderOrder = ensureFolderSettings(plugin, file.path)
		folderOrder.sortOrder = nextSortOrder
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
	}

	const overwriteCustomOrder = async () => {
		plugin.orderManager.overwriteCustomOrder(file.path)
		setSortOrder('custom')
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
		log(`Custom order overwritten from current sort for '${file.path}'`)
	}

	const handleClick = (e: React.MouseEvent, nextOrder: PickerOrder) => {
		e.stopPropagation()

		if (nextOrder === 'custom' && ignoreCustomClickRef.current) {
			ignoreCustomClickRef.current = false
			return
		}
		if (nextOrder === 'custom' && document.querySelector('.custom-order-icon .check-icon.fading')) {
			return log('Custom order is currently fading out, ignoring click')
		}

		let nextSortOrder: StoredSortOrder

		if (order === nextOrder && nextOrder !== 'custom') {
			nextSortOrder = toStoredSortOrder(nextOrder, direction === 'asc' ? 'desc' : 'asc')
			setSortOrder(nextSortOrder)
			void updateFolderSortOrder(nextSortOrder)
			return log(`Sort order changed to '${nextSortOrder}' for '${file.path}'`)
		}

		nextSortOrder = toStoredSortOrder(nextOrder, 'asc')
		setSortOrder(nextSortOrder)
		void updateFolderSortOrder(nextSortOrder)
		log(`Sort order changed to '${nextSortOrder}' for '${file.path}'`)
	}

	const handlePointerDown = () => {
		clearTimeout(holdTimeoutRef.current)
		clearTimeout(overwriteTimeoutRef.current)
		clearTimeout(hideTimeoutRef.current)
		clearTimeout(hideTimeoutFadeRef.current)

		if (order !== 'custom') {
			setCheckState('hidden')

			startTimeRef.current = Date.now()
			holdTimeoutRef.current = setTimeout(() => {
				log('Showing checkmark')
				setCheckState('visible')
			}, 200)
			overwriteTimeoutRef.current = setTimeout(() => {
				ignoreCustomClickRef.current = true
				void overwriteCustomOrder()
			}, 1400)
		} else {
			startTimeRef.current = 0
		}
	}

	const clearHold = () => {
		clearTimeout(holdTimeoutRef.current)
		holdTimeoutRef.current = undefined
		clearTimeout(overwriteTimeoutRef.current)
		overwriteTimeoutRef.current = undefined

		if (startTimeRef.current > 0) {
			const elapsed = Date.now() - startTimeRef.current
			log(`Pointer released after ${elapsed}ms`)

			if (elapsed >= 1400) {
				log('Circle animation nearly complete, letting full animation finish')
				const totalDuration = 3500
				const timeLeft = Math.max(0, totalDuration - elapsed)

				hideTimeoutRef.current = setTimeout(() => {
					log('Hiding checkmark')
					fadeOutCheck()
				}, timeLeft)
			} else {
				if (checkState === 'visible') fadeOutCheck()
			}

			startTimeRef.current = 0
		}
	}

	return <div className='sort-order-controls'>
		<button
			type='button'
			disabled={!isFolder}
			className={cn('custom-order-btn', order === 'custom' && isFolder && 'selected')}
			aria-label='Custom order'
			onPointerDownCapture={handlePointerDown}
			onPointerUpCapture={clearHold}
			onClickCapture={e => handleClick(e, 'custom')}
		><CustomOrderIcon><CheckIcon state={checkState}/></CustomOrderIcon></button>
		<button
			type='button'
			disabled={!isFolder}
			className={cn(order === 'filename' && 'selected')}
			aria-label={`File name (${order === 'filename' && direction === 'desc' ? 'z → a' : 'a → z'})`}
			onClickCapture={e => handleClick(e, 'filename')}
		><FileNameIcon direction={order === 'filename' ? direction : 'asc'}/></button>
		<button
			type='button'
			disabled={!isFolder}
			className={cn(order === 'modified' && 'selected')}
			aria-label={`Modified time (${order === 'modified' && direction === 'desc' ? 'old → new' : 'new → old'})`}
			onClickCapture={e => handleClick(e, 'modified')}
		><ModifiedTimeIcon direction={order === 'modified' ? direction : 'asc'}/></button>
		<button
			type='button'
			disabled={!isFolder}
			className={cn(order === 'created' && 'selected')}
			aria-label={`Created time (${order === 'created' && direction === 'desc' ? 'old → new' : 'new → old'})`}
			onClickCapture={e => handleClick(e, 'created')}
		><CreatedTimeIcon direction={order === 'created' ? direction : 'asc'}/></button>
	</div>
}

const PinHideControls = ({ file, plugin }: { file: TAbstractFile, plugin: ManualSortingPlugin }) => {
	const [isPinned, setIsPinned] = useState(plugin.settings.items[file.path]?.pinned ?? false)
	const [isHidden, setIsHidden] = useState(plugin.settings.items[file.path]?.hidden ?? false)

	const handlePin = async (e: React.MouseEvent) => {
		e.stopPropagation()
		const nextPinned = !isPinned
		plugin.settings.items[file.path] = {
			...getDefaultItemSettings(),
			...plugin.settings.items[file.path],
			pinned: nextPinned,
		}
		setIsPinned(nextPinned)
		await plugin.saveSettings()
		log(`Pin state changed to '${nextPinned}' for '${file.path}'`)
	}

	const handleHide = async (e: React.MouseEvent) => {
		e.stopPropagation()
		const nextHidden = !isHidden
		plugin.settings.items[file.path] = {
			...getDefaultItemSettings(),
			...plugin.settings.items[file.path],
			hidden: nextHidden,
		}
		setIsHidden(nextHidden)
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
		log(`Hidden state changed to '${nextHidden}' for '${file.path}'`)
	}

	return <div className='pin-hide-controls'>
		<button
			type='button'
			className={cn(isPinned && 'selected')}
			aria-label='Pin item'
			onClickCapture={e => void handlePin(e)}
		><PinIcon/></button>
		<button
			type='button'
			className={cn(isHidden && 'selected')}
			aria-label='Hide item'
			onClickCapture={e => void handleHide(e)}
		><HideIcon/></button>
	</div>
}

void `css
.ms-file-controls {
	flex-direction: row;
	.sort-order-controls, .pin-hide-controls, .show-hidden-controls {
		display: flex;
		align-items: center;
		gap: 4;
	}
	.pin-hide-controls {
		margin: 0 auto;
	}
	button {
		margin: 0;
		padding: 0;
		height: auto;
		background: none;
		box-shadow: none;
		cursor: pointer;
		width: 20;
		height: 20;
		&[disabled] {
			cursor: not-allowed;
			> svg:hover {
				opacity: 0.2;
			}
		}
		&:not([disabled]):hover {
			background-color: var(--background-modifier-hover);
		}
		> svg {
			stroke: var(--icon-color);
			stroke-width: 1.5;
			stroke-linecap: round;
			stroke-linejoin: round;
			fill: none;
			width: 16;
			opacity: 0.2;
			transition: opacity 0.3s;
			&:hover {
				opacity: 0.3;
			}
			button.selected & {
				opacity: 1;
			}
		}
	}
	.menu-scroll& {
		gap: 6;
		.sort-order-controls, .show-hidden-controls {
			gap: 2;
		}
		.separator {
			width: 2;
			height: 2;
			background-color: var(--divider-color);
		}
	}
}
`