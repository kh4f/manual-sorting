import { Plugin } from 'obsidian'
import type { FileExplorerView } from 'obsidian-typings'
import Sortable from 'sortablejs'
import { SettingsTab } from '@/components'
import { OrderManager } from '@/order-manager'
import type { LogLevel, PluginSettings } from '@/types.d'
import { DEFAULT_SETTINGS, MANUAL_SORTING_MODE_ID } from '@/constants'
import { Logger } from '@/utils/logger'
import { Patcher } from '@/patcher'

export default class ManualSortingPlugin extends Plugin {
	public orderManager!: OrderManager
	private patcher = new Patcher(this)
	private log = new Logger('core', '#ff4e37')
	public recentExplorerAction = ''
	public sortableInstances: Sortable[] = []
	public settings!: PluginSettings

	async onload() {
		await this.loadSettings()
		this.setLogLevel(this.settings.debugMode ? 'debug' : 'silent')
		if (process.env.DEV) this.log.info('Loading Manual Sorting in dev mode')
		this.addSettingTab(new SettingsTab(this.app, this))
		this.app.workspace.onLayoutReady(() => this.initialize())
	}

	onunload() {
		this.patcher.unpatchFileExplorer()
		this.patcher.unpatchSortOrderMenu()
		if (this.isManualSortingEnabled()) void this.reloadExplorerPlugin()
	}

	async initialize() {
		const prevManualSortingEnabledStatus = this.isManualSortingEnabled()
		this.patcher.patchSortable()
		this.patcher.patchSortOrderMenu()

		await this.waitForExplorer()
		const fileExplorerView = this.getFileExplorerView()
		// fix for Obsidian not saving the last selected sorting mode
		if (!prevManualSortingEnabledStatus) fileExplorerView.setSortOrder(this.settings.selectedSortOrder)
		this.patcher.patchFileExplorer()

		this.orderManager = new OrderManager(this)
		this.orderManager.updateOrder()

		if (this.isManualSortingEnabled()) void this.reloadExplorerPlugin()
	}

	async loadSettings() {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData() as Partial<PluginSettings>) }
		this.log.info('Settings loaded:', this.settings)
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.log.info('Settings saved:', this.settings)
	}

	async onExternalSettingsChange() {
		await this.loadSettings()
		this.log.warn('Settings changed externally')
		if (this.isManualSortingEnabled()) void this.reloadExplorerPlugin()
	}

	getFileExplorerView = () =>
		this.app.workspace.getLeavesOfType('file-explorer')[0].view as FileExplorerView

	isManualSortingEnabled = () =>
		this.settings.selectedSortOrder === MANUAL_SORTING_MODE_ID

	setLogLevel(logLevel: LogLevel) {
		Logger.logLevel = logLevel
		if (logLevel === 'debug') {
			this.settings.debugMode = true
			void this.saveSettings()
		}
	}

	toggleDragging() {
		this.sortableInstances.forEach(sortableInstance =>
			sortableInstance.option('disabled', !this.settings.draggingEnabled),
		)
	}

	async waitForExplorer() {
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

	async reloadExplorerPlugin() {
		const fileExplorerPlugin = this.app.internalPlugins.plugins['file-explorer']
		fileExplorerPlugin.disable()
		await fileExplorerPlugin.enable()
		this.log.info('File Explorer plugin reloaded')

		const toggleSortingClass = async () => {
			const explorerEl = await this.waitForExplorer()
			explorerEl.toggleClass('manual-sorting-enabled', this.isManualSortingEnabled())
		}
		if (this.isManualSortingEnabled()) void toggleSortingClass()

		const configureAutoScrolling = async () => {
			let scrollInterval: number | null = null
			const explorer = await this.waitForExplorer()

			explorer.removeEventListener('dragover', handleDragOver as EventListener)

			if (!this.isManualSortingEnabled()) return
			explorer.addEventListener('dragover', handleDragOver as EventListener)

			function handleDragOver(event: DragEvent) {
				event.preventDefault()
				const rect = explorer.getBoundingClientRect()
				const scrollZone = 50
				const scrollSpeed = 5

				if (event.clientY < rect.top + scrollZone) startScrolling(-scrollSpeed)
				else if (event.clientY > rect.bottom - scrollZone) startScrolling(scrollSpeed)
				else stopScrolling()
			}

			document.addEventListener('dragend', stopScrolling)
			document.addEventListener('drop', stopScrolling)
			document.addEventListener('mouseleave', stopScrolling)

			function startScrolling(speed: number) {
				if (scrollInterval) return

				function scrollStep() {
					explorer.scrollTop += speed
					scrollInterval = requestAnimationFrame(scrollStep)
				}

				scrollInterval = requestAnimationFrame(scrollStep)
			}

			function stopScrolling() {
				if (scrollInterval) {
					cancelAnimationFrame(scrollInterval)
					scrollInterval = null
				}
			}
		}
		if (this.isManualSortingEnabled()) void configureAutoScrolling()

		// [Dev mode] Add reload button to file explorer header instead of auto-reveal button
		const addReloadNavButton = async () => {
			await this.waitForExplorer()
			const fileExplorerView = this.getFileExplorerView()
			fileExplorerView.autoRevealButtonEl.style.display = 'none'
			fileExplorerView.headerDom.addNavButton('rotate-ccw', 'Reload app', () => {
				this.app.commands.executeCommandById('app:reload')
			})
		}
		if (process.env.DEV) void addReloadNavButton()

		if (this.app.plugins.getPlugin('folder-notes')) {
			this.log.info('Reloading Folder Notes plugin')
			await this.app.plugins.disablePlugin('folder-notes')
			void this.app.plugins.enablePlugin('folder-notes')
		}
	}
}