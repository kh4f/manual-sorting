import { createRoot } from 'react-dom/client'
import { useState, useRef, useEffect } from 'react'
import type ManualSortingPlugin from '@/plugin'
import type { SortOrder as StoredSortOrder } from '@/types'
import { getFileExplorerView, log, cn } from '@/utils'
import { CustomOrderIcon, CheckIcon, FileNameIcon, ModifiedTimeIcon, CreatedTimeIcon } from '@/ui/icons'

type ToolbarOrder = 'custom' | 'filename' | 'modified' | 'created'
type SortDirection = 'asc' | 'desc'
interface ShowToolbarEventDetail { x: number, y: number, folderPath: string }

const HIDE_DISTANCE = 5
const CHANGE_SORT_BTN_LABEL = i18next.t('plugins.file-explorer.action-change-sort')

const getToolbarOrder = (sortOrder: StoredSortOrder): ToolbarOrder => {
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

const getToolbarDirection = (sortOrder: StoredSortOrder): SortDirection => {
	switch (sortOrder) {
		case 'alphabeticalReverse':
		case 'byModifiedTimeReverse':
		case 'byCreatedTimeReverse': return 'desc'
		default: return 'asc'
	}
}

const toStoredSortOrder = (order: ToolbarOrder, direction: SortDirection): StoredSortOrder => {
	switch (order) {
		case 'filename':
			return direction === 'asc' ? 'alphabetical' : 'alphabeticalReverse'
		case 'modified':
			return direction === 'asc' ? 'byModifiedTime' : 'byModifiedTimeReverse'
		case 'created':
			return direction === 'asc' ? 'byCreatedTime' : 'byCreatedTimeReverse'
		default:
			return 'custom'
	}
}

export const mountToolbar = (plugin: ManualSortingPlugin) => {
	let toolbarEl = document.getElementById('ms-toolbar')
	if (toolbarEl) return log('Toolbar already exists:', toolbarEl)
	toolbarEl = document.body.createDiv({ attr: { id: 'ms-toolbar' } })
	createRoot(toolbarEl).render(<Toolbar el={toolbarEl} plugin={plugin}/>)
	log('Toolbar mounted:', toolbarEl)
}

const Toolbar = ({ el, plugin }: { el: HTMLElement, plugin: ManualSortingPlugin }) => {
	const [sortOrder, setSortOrder] = useState<StoredSortOrder>('custom')
	const [checkState, setCheckState] = useState<'hidden' | 'visible' | 'fading'>('hidden')
	const [position, setPosition] = useState<{ x: number, y: number } | null>(null)
	const [activeFolderPath, setActiveFolderPath] = useState<string>('/')
	const holdTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const overwriteTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const startTimeRef = useRef<number>(0)
	const hideTimeoutFadeRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const ignoreCustomClickRef = useRef(false)
	const order = getToolbarOrder(sortOrder)
	const direction = getToolbarDirection(sortOrder)

	useEffect(() => {
		if (position) {
			el.addClass('visible')
			el.style.top = `${position.y}px`
			el.style.left = `${position.x}px`
		} else {
			el.removeClass('visible')
		}
	}, [position, el])

	useEffect(() => {
		const handleSortButtonClick = (e: MouseEvent) => {
			if (!(e.target instanceof Element)) return

			const sortButton = e.target.closest<HTMLElement>(`.nav-action-button[aria-label='${CHANGE_SORT_BTN_LABEL}']`)
			if (!sortButton) return

			e.stopPropagation()
			const rect = sortButton.getBoundingClientRect()
			setActiveFolderPath('/')
			setPosition({ x: rect.left - 40, y: rect.top + 10 })
			log('File Explorer sort button clicked, opening toolbar')
		}

		const handleShow = (e: Event) => {
			const customEvent = e as CustomEvent<ShowToolbarEventDetail>
			setActiveFolderPath(customEvent.detail.folderPath)
			setPosition({ x: customEvent.detail.x, y: customEvent.detail.y })
		}
		const handleClickOutside = (e: MouseEvent) => {
			if (!(e.target instanceof Node)) return
			if (!el.contains(e.target)) setPosition(null)
		}

		document.addEventListener('click', handleSortButtonClick, true)
		document.addEventListener('click', handleClickOutside)
		document.addEventListener('ms-show-toolbar', handleShow)

		return () => {
			document.removeEventListener('click', handleSortButtonClick, true)
			document.removeEventListener('click', handleClickOutside)
			document.removeEventListener('ms-show-toolbar', handleShow)
		}
	}, [el])

	useEffect(() => {
		const folderSortOrder = plugin.settings.customOrder[activeFolderPath].sortOrder
		// eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect
		setSortOrder(folderSortOrder)
	}, [activeFolderPath, plugin.settings.customOrder, position])

	useEffect(() => {
		if (!position) return

		const handlePointerMove = (e: PointerEvent) => {
			const rect = el.getBoundingClientRect()
			const dx = e.clientX < rect.left
				? rect.left - e.clientX
				: e.clientX > rect.right
					? e.clientX - rect.right
					: 0
			const dy = e.clientY < rect.top
				? rect.top - e.clientY
				: e.clientY > rect.bottom
					? e.clientY - rect.bottom
					: 0
			const dist = Math.hypot(dx, dy)

			if (dist > HIDE_DISTANCE) {
				log(`Pointer moved ${Math.round(dist)}px away from toolbar, hiding`)
				setPosition(null)
			}
		}

		document.addEventListener('pointermove', handlePointerMove)

		return () => document.removeEventListener('pointermove', handlePointerMove)
	}, [position, el])

	const fadeOutCheck = () => {
		setCheckState('fading')
		hideTimeoutFadeRef.current = setTimeout(() => setCheckState('hidden'), 300)
	}

	const updateFolderSortOrder = async (nextSortOrder: StoredSortOrder) => {
		const folderOrder = plugin.settings.customOrder[activeFolderPath]
		folderOrder.sortOrder = nextSortOrder
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
	}

	const overwriteCustomOrder = async () => {
		plugin.orderManager.overwriteCustomOrder(activeFolderPath)
		setSortOrder('custom')
		await plugin.saveSettings()
		plugin.explorerManager.refreshFolderIndicators()
		getFileExplorerView().sort()
		log(`Custom order overwritten from current sort for '${activeFolderPath}'`)
	}

	const handleClick = (nextOrder: ToolbarOrder) => {
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
			return log(`Sort order changed to '${nextSortOrder}' for '${activeFolderPath}'`)
		}

		nextSortOrder = toStoredSortOrder(nextOrder, 'asc')
		setSortOrder(nextSortOrder)
		void updateFolderSortOrder(nextSortOrder)
		log(`Sort order changed to '${nextSortOrder}' for '${activeFolderPath}'`)
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
			onPointerDown={handlePointerDown}
			onPointerUp={clearHold}
			onPointerLeave={clearHold}
			onClick={() => handleClick('custom')}>
			<CustomOrderIcon><CheckIcon state={checkState}/></CustomOrderIcon>
		</button>
		<button
			type='button'
			className={cn(order === 'filename' && 'selected')}
			aria-label={`File name (${order === 'filename' && direction === 'desc' ? 'z → a' : 'a → z'})`}
			onClick={() => handleClick('filename')}>
			<FileNameIcon direction={order === 'filename' ? direction : 'asc'}/>
		</button>
		<button
			type='button'
			className={cn(order === 'modified' && 'selected')}
			aria-label={`Modified time (${order === 'modified' && direction === 'desc' ? 'old → new' : 'new → old'})`}
			onClick={() => handleClick('modified')}>
			<ModifiedTimeIcon direction={order === 'modified' ? direction : 'asc'}/>
		</button>
		<button
			type='button'
			className={cn(order === 'created' && 'selected')}
			aria-label={`Created time (${order === 'created' && direction === 'desc' ? 'old → new' : 'new → old'})`}
			onClick={() => handleClick('created')}>
			<CreatedTimeIcon direction={order === 'created' ? direction : 'asc'}/>
		</button>
	</>
}

void `css
#ms-toolbar {
	position: absolute;
	z-index: 100;
	padding: 0 8;
	background: var(--background-primary);
	border-radius: 16;
	align-items: center;
	justify-content: center;
	gap: 8;
	border: 1px solid var(--divider-color);
	box-shadow: 0 0 16 hsl(0, 0, 0, 0.3);
	display: none;
	opacity: 0;
	transform: translateY(3);
	transition: opacity, top, left, display allow-discrete, transform;
	transition-duration: 0.5s;

	&.visible {
		display: flex;
		opacity: 1;
		transform: translateY(0);
		@starting-style { opacity: 0; transform: translateY(3); }
	}

	button {
		margin: 0;
		padding: 0;
		height: 26px;
		background: none;
		box-shadow: none;
		cursor: pointer;

		&:not(.custom-order-btn) {
			opacity: 0.2;
			transition: opacity 0.3s;
		}
		&.selected {
			opacity: 1;
		}
		> svg {
			stroke: var(--icon-color);
			stroke-width: 1.5px;
			stroke-linecap: round;
			stroke-linejoin: round;
			fill: none;
			width: 16px;
		}
	}
}
`