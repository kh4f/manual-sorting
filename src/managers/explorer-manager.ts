import type ManualSortingPlugin from '@/plugin'
import { getFileExplorerView, initLog } from '@/utils'
import { mountChildCounter } from '@/ui/child-counter'

const FILE_EXPLORER_SELECTOR = '[data-type="file-explorer"] > .nav-files-container'
const FOLDER_TITLE_SELECTOR = '.nav-folder-title'

export class ExplorerManager {
	private log = initLog('EXPLORER-MANAGER', '#ffa700')
	private explorerMountObservers = new Set<MutationObserver>()
	private folderIndicatorsObserver: MutationObserver | null = null
	private observedExplorerEl: HTMLElement | null = null

	constructor(private plugin: ManualSortingPlugin) {}

	waitForExplorerElement = async (disableLogs = false) => new Promise<HTMLElement>(resolve => {
		this.observeExplorerMount(resolve, true, true, disableLogs)
	})

	refreshExplorerOnMount = () => this.observeExplorerMount(el => this.refreshExplorer(el), false, false)

	refreshExplorer(explorerEl?: HTMLElement) {
		explorerEl ??= document.querySelector(FILE_EXPLORER_SELECTOR)!
		this.log('Refreshing Explorer after mount')
		this.plugin.orderManager.reconcileOrder()
		getFileExplorerView().setSortOrder(this.plugin.settings.customOrder['/'].sortOrder)
		void this.plugin.dndManager.enable()
		this.observeFolderIndicators(explorerEl)
	}

	refreshFolderIndicators(root?: HTMLElement) {
		root ??= this.observedExplorerEl ?? document.querySelector<HTMLElement>(FILE_EXPLORER_SELECTOR) ?? undefined
		if (!root) return
		this.syncFolderIndicators(root)
	}

	disconnect() {
		this.folderIndicatorsObserver?.disconnect()
		this.folderIndicatorsObserver = null
		this.observedExplorerEl = null
		this.explorerMountObservers.forEach(observer => observer.disconnect())
		this.explorerMountObservers.clear()
	}

	private syncFolderIndicators(root: HTMLElement) {
		const folderTitles = root.matches(FOLDER_TITLE_SELECTOR)
			? [root]
			: [...root.querySelectorAll<HTMLElement>(FOLDER_TITLE_SELECTOR)]

		folderTitles.forEach(folderTitle => mountChildCounter(folderTitle))
	}

	private observeFolderIndicators(explorerEl: HTMLElement) {
		this.syncFolderIndicators(explorerEl)
		if (this.observedExplorerEl === explorerEl && this.folderIndicatorsObserver) return

		this.folderIndicatorsObserver?.disconnect()
		this.observedExplorerEl = explorerEl
		this.folderIndicatorsObserver = new MutationObserver(() => {
			this.syncFolderIndicators(explorerEl)
		})
		this.folderIndicatorsObserver.observe(explorerEl, { childList: true, subtree: true })
	}

	private observeExplorerMount(onMount: (el: HTMLElement) => void, disconnectOnMount = false, checkExisting = true, disableLogs = false) {
		if (checkExisting) {
			const target = document.querySelector(FILE_EXPLORER_SELECTOR)
			if (target instanceof HTMLElement) {
				if (!disableLogs) this.log('Explorer already mounted', target)
				onMount(target)
				return
			}
		}
		const observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node instanceof HTMLElement && node.matches(FILE_EXPLORER_SELECTOR)) {
						if (disconnectOnMount) {
							observer.disconnect()
							this.explorerMountObservers.delete(observer)
						}
						if (!disableLogs) this.log('Explorer mounted', node)
						onMount(node)
						return
					}
				}
			}
		})
		this.explorerMountObservers.add(observer)
		observer.observe(document.querySelector('.workspace') ?? document.body, { childList: true, subtree: true })
	}
}