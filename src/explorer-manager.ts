import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils/logger'
import { FILE_EXPLORER_SELECTOR } from '@/constants'

export class ExplorerManager {
	constructor(private plugin: ManualSortingPlugin) {}
	private log = new Logger('explorer-manager', '#bf77ff')

	async waitForExplorerElement() {
		return new Promise<HTMLElement>(resolve => {
			this.observeExplorerMount(resolve, true)
		})
	}

	refreshExplorerOnMount = () => this.observeExplorerMount(() => void this.refreshExplorer(false))

	async refreshExplorer(reloadPlugin = true) {
		if (reloadPlugin) await this.reloadExplorerPlugin()
		void this.updateManualSortingClass()
		void this.setupAutoScrolling()
		void this.addAppReloadButton()
		void this.reloadFolderNotesPlugin()
	}

	private observeExplorerMount(onMount: (el: HTMLElement) => void, disconnectOnMount = false) {
		const target = document.querySelector(FILE_EXPLORER_SELECTOR)
		if (target instanceof HTMLElement) {
			onMount(target)
			return
		}
		new MutationObserver((mutations, obs) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node instanceof HTMLElement && node.matches(FILE_EXPLORER_SELECTOR)) {
						if (disconnectOnMount) obs.disconnect()
						this.log.info('File Explorer mounted', node)
						onMount(node)
						return
					}
				}
			}
		}).observe(document.querySelector('.workspace') ?? document.body, { childList: true, subtree: true })
	}

	private async reloadExplorerPlugin() {
		const fileExplorerPlugin = this.plugin.app.internalPlugins.plugins['file-explorer']
		fileExplorerPlugin.disable()
		await fileExplorerPlugin.enable()
		this.log.info('File Explorer plugin reloaded')
	}

	private async updateManualSortingClass() {
		const explorerEl = await this.waitForExplorerElement()
		explorerEl.toggleClass('manual-sorting-enabled', this.plugin.isManualSortingEnabled())
	}

	private async setupAutoScrolling() {
		if (!this.plugin.isManualSortingEnabled()) return
		let scrollInterval: number | null = null
		const explorer = await this.waitForExplorerElement()

		const startScrolling = (speed: number) => {
			if (scrollInterval) return
			const scrollStep = () => {
				explorer.scrollTop += speed
				scrollInterval = requestAnimationFrame(scrollStep)
			}
			scrollInterval = requestAnimationFrame(scrollStep)
		}

		const stopScrolling = () => {
			if (scrollInterval) {
				cancelAnimationFrame(scrollInterval)
				scrollInterval = null
			}
		}

		const handleDragOver = (event: DragEvent) => {
			event.preventDefault()
			const rect = explorer.getBoundingClientRect()
			const scrollZone = 50
			const scrollSpeed = 5

			if (event.clientY < rect.top + scrollZone) startScrolling(-scrollSpeed)
			else if (event.clientY > rect.bottom - scrollZone) startScrolling(scrollSpeed)
			else stopScrolling()
		}

		explorer.removeEventListener('dragover', handleDragOver as EventListener)

		if (!this.plugin.isManualSortingEnabled()) return
		explorer.addEventListener('dragover', handleDragOver as EventListener)

		document.addEventListener('dragend', stopScrolling)
		document.addEventListener('drop', stopScrolling)
		document.addEventListener('mouseleave', stopScrolling)
	}

	private async addAppReloadButton() {
		if (!process.env.DEV) return
		// Add app reload button to file explorer header instead of auto-reveal button
		await this.waitForExplorerElement()
		const fileExplorerView = this.plugin.getFileExplorerView()
		fileExplorerView.autoRevealButtonEl.style.display = 'none'
		if (fileExplorerView.headerDom.navButtonsEl.querySelector('.nav-action-button[aria-label="Reload app"]')) return
		fileExplorerView.headerDom.addNavButton('rotate-ccw', 'Reload app', () => {
			this.plugin.app.commands.executeCommandById('app:reload')
		})
	}

	private async reloadFolderNotesPlugin() {
		if (this.plugin.app.plugins.getPlugin('folder-notes')) {
			this.log.info('Reloading Folder Notes plugin')
			await this.plugin.app.plugins.disablePlugin('folder-notes')
			void this.plugin.app.plugins.enablePlugin('folder-notes')
		}
	}
}