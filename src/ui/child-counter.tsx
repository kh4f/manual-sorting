import { createRoot } from 'react-dom/client'
import { TFolder } from 'obsidian'
import { getFileExplorerView } from '@/utils'

const counterRoots = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>()

export const mountChildCounter = (folderTitle: HTMLElement) => {
	const folderEl = folderTitle.closest<HTMLElement>('.nav-folder')
	if (!folderEl) return

	const folder = getFileExplorerView().files.get(folderEl)
	if (!(folder instanceof TFolder)) return

	const childrenCount = getFileExplorerView().getSortedFolderItems(folder, true).length

	let counterEl = folderTitle.querySelector<HTMLElement>('.ms-child-counter')
	if (!counterEl) counterEl = folderTitle.createDiv({ cls: 'ms-child-counter' })

	let counterRoot = counterRoots.get(counterEl)
	if (!counterRoot) {
		counterRoot = createRoot(counterEl)
		counterRoots.set(counterEl, counterRoot)
	}

	counterRoot.render(<ChildCounter childrenCount={childrenCount}/>)
}

export const ChildCounter = ({ childrenCount }: { childrenCount: number }) => <span>{childrenCount}</span>

void `css
.ms-child-counter {
	margin-left: auto;
	span {
		opacity: 0.3;
	}
}
`