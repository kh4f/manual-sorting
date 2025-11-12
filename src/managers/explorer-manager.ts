import type ManualSortingPlugin from '@/plugin'
import { FILE_EXPLORER_SELECTOR } from '@/constants'
import { Logger } from '@/utils'

export class ExplorerManager {
	private log = new Logger('EXPLORER-MANAGER', '#ffa700')

	constructor(private plugin: ManualSortingPlugin) {}

	waitForExplorerElement = async (disableLogs = false) => new Promise<HTMLElement>(resolve => {
		this.observeExplorerMount(resolve, true, true, disableLogs)
	})

	refreshExplorerOnMount = () => this.observeExplorerMount(() => this.refreshExplorer(), false, false)

	refreshExplorer() {
		this.log.info('Refreshing Explorer after mount')
		this.plugin.orderManager.reconcileOrder()
		this.plugin.getFileExplorerView().setSortOrder(this.plugin.settings.sortOrder)
		if (this.plugin.isCustomSortingActive()) void this.plugin.dndManager.enable()
	}

	private observeExplorerMount(onMount: (el: HTMLElement) => void, disconnectOnMount = false, checkExisting = true, disableLogs = false) {
		if (checkExisting) {
			const target = document.querySelector(FILE_EXPLORER_SELECTOR)
			if (target instanceof HTMLElement) {
				if (!disableLogs) this.log.info('Explorer already mounted', target)
				console.log()
				onMount(target)
				return
			}
		}
		new MutationObserver((mutations, obs) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node instanceof HTMLElement && node.matches(FILE_EXPLORER_SELECTOR)) {
						if (disconnectOnMount) obs.disconnect()
						if (!disableLogs) this.log.info('Explorer mounted', node)
						onMount(node)
						return
					}
				}
			}
		}).observe(document.querySelector('.workspace') ?? document.body, { childList: true, subtree: true })
	}
}