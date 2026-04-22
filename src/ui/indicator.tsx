import { createRoot } from 'react-dom/client'
import type ManualSortingPlugin from '@/plugin'
import type { SortOrder } from '@/types'
import { CustomOrderIcon, CreatedTimeIcon, FileNameIcon, ModifiedTimeIcon } from '@/ui/icons'
import { showSortOrderPickerEvent } from '@/ui/sort-order-picker'
import { log, getFileExplorerView } from '@/utils'

const indicatorRoots = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>()

export const mountIndicator = (folderTitle: HTMLElement, plugin: ManualSortingPlugin) => {
	const folderEl = folderTitle.closest<HTMLElement>('.nav-folder')
	if (!folderEl) return

	const folderPath = getFileExplorerView().files.get(folderEl)?.path
	if (!folderPath) return

	const sortOrder = plugin.settings.customOrder[folderPath].sortOrder
	let indicatorEl = folderTitle.querySelector<HTMLElement>('.ms-indicator')
	if (!indicatorEl) indicatorEl = folderTitle.createDiv({ cls: 'ms-indicator' })

	let indicatorRoot = indicatorRoots.get(indicatorEl)
	if (!indicatorRoot) {
		indicatorRoot = createRoot(indicatorEl)
		indicatorRoots.set(indicatorEl, indicatorRoot)
	}

	indicatorRoot.render(<Indicator sortOrder={sortOrder} folderPath={folderPath}/>)
}

const getSortIcon = (sortOrder: SortOrder) => {
	switch (sortOrder) {
		case 'alphabetical': return <FileNameIcon direction='asc'/>
		case 'alphabeticalReverse': return <FileNameIcon direction='desc'/>
		case 'byModifiedTime': return <ModifiedTimeIcon direction='asc'/>
		case 'byModifiedTimeReverse': return <ModifiedTimeIcon direction='desc'/>
		case 'byCreatedTime': return <CreatedTimeIcon direction='asc'/>
		case 'byCreatedTimeReverse': return <CreatedTimeIcon direction='desc'/>
		default: return <CustomOrderIcon/>
	}
}

export const Indicator = ({ sortOrder, folderPath }: { sortOrder: SortOrder, folderPath: string }) => {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
		document.dispatchEvent(new CustomEvent(showSortOrderPickerEvent, { detail: { x: rect.left - 33, y: rect.top - 6, folderPath } }))
		log('Indicator clicked, showing sort order picker for folder:', folderPath)
	}

	return <button onClick={handleClick}>{getSortIcon(sortOrder)}</button>
}

void `css
.ms-indicator {
	position: absolute;
	right: 8;
	opacity: 0;
	transition: opacity 0.3s;
	display: flex;

	.nav-folder-title:hover > & {
		opacity: 0.3;
	}

	button {
		padding: 0;
		height: auto;
		background: none;
		box-shadow: none;
		cursor: pointer;

		svg {
			stroke: var(--icon-color);;
			stroke-width: 1.5;
			stroke-linecap: round;
			stroke-linejoin: round;
			fill: none;
			width: 16;
		}
	}
}
`