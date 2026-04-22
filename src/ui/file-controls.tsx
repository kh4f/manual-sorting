import { createRoot } from 'react-dom/client'
import { useState, useRef } from 'react'
import type ManualSortingPlugin from '@/plugin'
import type { SortOrder as StoredSortOrder } from '@/types'
import { getFileExplorerView, log, cn } from '@/utils'
import { CustomOrderIcon, CheckIcon, FileNameIcon, ModifiedTimeIcon, CreatedTimeIcon } from '@/ui/icons'

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

export const mountFileControls = (root: HTMLElement, folderPath: string, plugin: ManualSortingPlugin) => {
	createRoot(root).render(<FileControls folderPath={folderPath} plugin={plugin}/>)
	log(`File controls mounted for '${folderPath}':`, root)
}

const FileControls = ({ folderPath, plugin }: { folderPath: string, plugin: ManualSortingPlugin }) => {
	const [sortOrder, setSortOrder] = useState<StoredSortOrder>(plugin.settings.customOrder[folderPath].sortOrder)
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
		const folderOrder = plugin.settings.customOrder[folderPath]
		folderOrder.sortOrder = nextSortOrder
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
	}

	const overwriteCustomOrder = async () => {
		plugin.orderManager.overwriteCustomOrder(folderPath)
		setSortOrder('custom')
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
		log(`Custom order overwritten from current sort for '${folderPath}'`)
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
			return log(`Sort order changed to '${nextSortOrder}' for '${folderPath}'`)
		}

		nextSortOrder = toStoredSortOrder(nextOrder, 'asc')
		setSortOrder(nextSortOrder)
		void updateFolderSortOrder(nextSortOrder)
		log(`Sort order changed to '${nextSortOrder}' for '${folderPath}'`)
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

	return <>
		<button
			type='button'
			className={cn('custom-order-btn', order === 'custom' && 'selected')}
			aria-label='Custom order'
			onPointerDownCapture={handlePointerDown}
			onPointerUpCapture={clearHold}
			onClickCapture={e => handleClick(e, 'custom')}
		><CustomOrderIcon><CheckIcon state={checkState}/></CustomOrderIcon></button>
		<button
			type='button'
			className={cn(order === 'filename' && 'selected')}
			aria-label={`File name (${order === 'filename' && direction === 'desc' ? 'z → a' : 'a → z'})`}
			onClickCapture={e => handleClick(e, 'filename')}
		><FileNameIcon direction={order === 'filename' ? direction : 'asc'}/></button>
		<button
			type='button'
			className={cn(order === 'modified' && 'selected')}
			aria-label={`Modified time (${order === 'modified' && direction === 'desc' ? 'old → new' : 'new → old'})`}
			onClickCapture={e => handleClick(e, 'modified')}
		><ModifiedTimeIcon direction={order === 'modified' ? direction : 'asc'}/></button>
		<button
			type='button'
			className={cn(order === 'created' && 'selected')}
			aria-label={`Created time (${order === 'created' && direction === 'desc' ? 'old → new' : 'new → old'})`}
			onClickCapture={e => handleClick(e, 'created')}
		><CreatedTimeIcon direction={order === 'created' ? direction : 'asc'}/></button>
	</>
}

void `css
.ms-file-controls {
	padding: 2 6;
	gap: 4;
	button {
		margin: 0;
		padding: 0;
		height: auto;
		background: none;
		box-shadow: none;
		cursor: pointer;
		width: 20;
		height: 20;
		&:hover {
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
			button.selected & {
				opacity: 1;
			}
		}
	}
	&.selected {
		background-color: transparent !important;
	}
}
`