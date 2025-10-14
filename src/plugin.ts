import { Plugin } from 'obsidian'
import type { FileExplorerView } from 'obsidian-typings'
import { SettingsTab } from '@/components'
import { OrderManager } from '@/order-manager'
import type { LogLevel, PluginSettings } from '@/types.d'
import { DEFAULT_SETTINGS, MANUAL_SORTING_MODE_ID } from '@/constants'
import { Logger } from '@/utils/logger'
import { Patcher } from '@/patcher'
import { ExplorerManager } from '@/explorer-manager'

export default class ManualSortingPlugin extends Plugin {
	public orderManager!: OrderManager
	private patcher = new Patcher(this)
	public explorerManager = new ExplorerManager(this)
	private log = new Logger('core', '#ff4e37')
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
		if (this.isManualSortingEnabled()) void this.explorerManager.refreshExplorer()
	}

	async initialize() {
		const prevManualSortingEnabledStatus = this.isManualSortingEnabled()
		this.patcher.patchSortable()
		this.patcher.patchSortOrderMenu()

		await this.explorerManager.waitForExplorerElement()
		const fileExplorerView = this.getFileExplorerView()
		// fix for Obsidian not saving the last selected sorting mode
		if (!prevManualSortingEnabledStatus) fileExplorerView.setSortOrder(this.settings.selectedSortOrder)
		this.patcher.patchFileExplorer()

		this.orderManager = new OrderManager(this)
		this.orderManager.updateOrder()

		if (this.isManualSortingEnabled()) await this.explorerManager.refreshExplorer()
		this.explorerManager.observeExplorerMount()
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
		if (this.isManualSortingEnabled()) void this.explorerManager.refreshExplorer()
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
}