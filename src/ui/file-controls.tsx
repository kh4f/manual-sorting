import { createRoot } from 'react-dom/client'
import { useState, useRef } from 'react'
import { TFolder, type TAbstractFile } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import type { SortOrder as StoredSortOrder } from '@/types'
import { getFileExplorerView, log, cn } from '@/utils'
import { CustomOrderIcon, CheckIcon, FileNameIcon, ModifiedTimeIcon, CreatedTimeIcon, PinIcon, HideIcon } from '@/ui/icons'

type PickerOrder = 'custom' | 'filename' | 'modified' | 'created'
type SortDirection = 'asc' | 'desc'

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
	createRoot(root).render(<FileControls file={file} plugin={plugin}/>)
	log(`File controls mounted for '${file.path}':`, root)
}

const FileControls = ({ file, plugin }: { file: TAbstractFile, plugin: ManualSortingPlugin }) => {
	return <>
		<SortOrderControls file={file} plugin={plugin}/>
		<PinHideControls/>
	</>
}

const SortOrderControls = ({ file, plugin }: { file: TAbstractFile, plugin: ManualSortingPlugin }) => {
	const isFolder = file instanceof TFolder
	const [sortOrder, setSortOrder] = useState<StoredSortOrder>(isFolder ? plugin.settings.customOrder[file.path].sortOrder : 'custom')
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
		const folderOrder = plugin.settings.customOrder[file.path]
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

const PinHideControls = () => {
	return <div className='pin-hide-controls'>
		<button type='button' className='pin-btn' aria-label='Pin item'><PinIcon/></button>
		<button type='button' className='hide-btn' aria-label='Hide item'><HideIcon/></button>
	</div>
}

void `css
.ms-file-controls {
	.sort-order-controls, .pin-hide-controls {
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
}
`