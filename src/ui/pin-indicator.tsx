import { createRoot } from 'react-dom/client'
import { PinIcon } from '@/ui/icons'

const pinRoots = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>()
const PIN_SELECTOR = '.ms-pin-indicator'

export const mountPinIndicator = (treeItemSelf: HTMLElement) => {
	let pinEl = treeItemSelf.querySelector<HTMLElement>(PIN_SELECTOR)
	if (!pinEl) pinEl = treeItemSelf.createDiv({ cls: 'ms-pin-indicator' })

	let pinRoot = pinRoots.get(pinEl)
	if (!pinRoot) {
		pinRoot = createRoot(pinEl)
		pinRoots.set(pinEl, pinRoot)
	}

	pinRoot.render(<PinIndicator/>)
}

export const unmountPinIndicator = (treeItemSelf: HTMLElement) => {
	const pinEl = treeItemSelf.querySelector<HTMLElement>(PIN_SELECTOR)
	if (!pinEl) return

	const pinRoot = pinRoots.get(pinEl)
	pinRoot?.unmount()
	pinRoots.delete(pinEl)
	pinEl.remove()
}

export const PinIndicator = () => <PinIcon/>

void `css
.ms-pin-indicator {
	display: flex;
	align-items: center;
	margin-left: auto;
	.pin-icon {
		stroke: var(--icon-color);
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		fill: none;
		width: 16;
		opacity: 0.3;
	}
}
.tree-item-self {
	align-items: center;
}
`