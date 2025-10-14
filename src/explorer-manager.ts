import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils/logger'

export class ExplorerManager {
	constructor(private plugin: ManualSortingPlugin) {}
	private log = new Logger('explorer-manager', '#bf77ff')

	async waitForExplorerElement() {
		return new Promise<Element>(resolve => {
			const getExplorer = () => document.querySelector('[data-type="file-explorer"] .nav-files-container')
			const explorer = getExplorer()
			if (explorer) {
				resolve(explorer)
				return
			}

			const observer = new MutationObserver((_, obs) => {
				const explorer = getExplorer()
				if (explorer) {
					obs.disconnect()
					resolve(explorer)
				}
			})
			const workspace = document.querySelector('.workspace')
			if (workspace) observer.observe(workspace, { childList: true, subtree: true })
		})
	}

	async reloadFileExplorerPlugin() {
		const fileExplorerPlugin = this.plugin.app.internalPlugins.plugins['file-explorer']
		fileExplorerPlugin.disable()
		await fileExplorerPlugin.enable()
		this.log.info('File Explorer plugin reloaded')

		if (this.plugin.isManualSortingEnabled()) {
			await this.updateManualSortingClass()
			void this.configureAutoScrolling()
		}

		void this.addReloadNavButton()
		await this.reloadFolderNotesPlugin()
	}

	private async updateManualSortingClass() {
		const explorerEl = await this.waitForExplorerElement()
		explorerEl.toggleClass('manual-sorting-enabled', this.plugin.isManualSortingEnabled())
	}

	private async configureAutoScrolling() {
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

	private async addReloadNavButton() {
		if (!process.env.DEV) return
		// Add reload button to file explorer header instead of auto-reveal button
		await this.waitForExplorerElement()
		const fileExplorerView = this.plugin.getFileExplorerView()
		fileExplorerView.autoRevealButtonEl.style.display = 'none'
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