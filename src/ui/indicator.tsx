import { createRoot } from 'react-dom/client'
import { TFolder } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import type { SortOrder } from '@/types'
import { CustomOrderIcon, CreatedTimeIcon, FileNameIcon, ModifiedTimeIcon } from '@/ui/icons'
import { showSortOrderPickerEvent } from '@/ui/sort-order-picker'
import { log, getFileExplorerView } from '@/utils'

const indicatorRoots = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>()

export const mountIndicator = (folderTitle: HTMLElement, plugin: ManualSortingPlugin) => {
	const folderEl = folderTitle.closest<HTMLElement>('.nav-folder')
	if (!folderEl) return

	const folder = getFileExplorerView().files.get(folderEl)
	if (!(folder instanceof TFolder)) return

	const folderPath = folder.path
	const childrenCount = folder.children.length

	const sortOrder = plugin.settings.customOrder[folderPath].sortOrder
	let indicatorEl = folderTitle.querySelector<HTMLElement>('.ms-indicator')
	if (!indicatorEl) indicatorEl = folderTitle.createDiv({ cls: 'ms-indicator' })

	let indicatorRoot = indicatorRoots.get(indicatorEl)
	if (!indicatorRoot) {
		indicatorRoot = createRoot(indicatorEl)
		indicatorRoots.set(indicatorEl, indicatorRoot)
	}

	indicatorRoot.render(<Indicator sortOrder={sortOrder} folderPath={folderPath} childrenCount={childrenCount}/>)
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

export const Indicator = ({ sortOrder, folderPath, childrenCount }: { sortOrder: SortOrder, folderPath: string, childrenCount: number }) => {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
		document.dispatchEvent(new CustomEvent(showSortOrderPickerEvent, { detail: { x: rect.left - 33, y: rect.top - 6, folderPath } }))
		log('Indicator clicked, showing sort order picker for folder:', folderPath)
	}

	return <button onClick={handleClick}>
		<span className='count'>{childrenCount}</span>
		<span className='sort-order-icon'>{getSortIcon(sortOrder)}</span>
	</button>
}

void `css
.ms-indicator {
	margin-left: auto;
	display: flex;

	button {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 16px;
		padding: 0;
		height: auto;
		background: none;
		box-shadow: none;
		cursor: pointer;
		color: var(--text-muted);

		.count {
			line-height: var(--line-height-tight);
			opacity: 0.2;
			transition: opacity 0.3s;
		}

		.sort-order-icon {
			position: absolute;
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0;
			transition: opacity 0.3s;
		}

		svg {
			stroke: var(--icon-color);;
			stroke-width: 1.5;
			stroke-linecap: round;
			stroke-linejoin: round;
			fill: none;
			width: 16;
			height: 16;
		}
	}

	.nav-folder-title:hover > & {
		.count { opacity: 0; }
		.sort-order-icon { opacity: 0.7; }
	}
}
.nav-folder-title {
	align-items: center;
}
`