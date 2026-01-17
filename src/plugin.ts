import { Plugin, TAbstractFile } from 'obsidian'
import type { FileExplorerView } from 'obsidian-typings'
import { SettingsTab } from '@/components'
import { OrderManager, Patcher, ExplorerManager, DndManager } from '@/managers'
import type { PluginSettings, LegacyPluginSettings, SortOrder } from '@/types'
import { DEFAULT_SETTINGS, CUSTOM_SORT_ORDER_ID } from '@/constants'
import { Logger } from '@/utils'

export default class ManualSortingPlugin extends Plugin {
	public orderManager = new OrderManager(this)
	private patcher = new Patcher(this)
	public explorerManager = new ExplorerManager(this)
	public dndManager = new DndManager(this)
	private log = new Logger('CORE', '#ff4828')
	public settings!: PluginSettings

	async onload() {
		await this.loadSettings()
		Logger.logLevel = this.settings.debugMode ? 'debug' : 'silent'
		if (process.env.DEV) this.log.info('Loading Manual Sorting in dev mode')
		this.addSettingTab(new SettingsTab(this.app, this))
		this.app.workspace.onLayoutReady(() => this.initialize())
	}

	onunload() {
		this.patcher.unpatchExplorer()
		this.patcher.unpatchSortOrderMenu()
		this.dndManager.disable()
		this.getFileExplorerView().sort()
		this.log.info('Manual Sorting unloaded')
	}

	async initialize() {
		await this.explorerManager.waitForExplorerElement()
		this.patcher.patchExplorer()
		this.patcher.patchSortOrderMenu()
		this.explorerManager.refreshExplorer()
		this.explorerManager.refreshExplorerOnMount()
		this.registerVaultHandlers()
	}

	registerVaultHandlers() {
		this.app.vault.on('rename', (item: TAbstractFile, oldPath: string) => {
			const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
			const newDir = item.path.substring(0, item.path.lastIndexOf('/')) || '/'

			const shouldIgnoreOld = this.isPathIgnored(oldDir) || this.isPathIgnored(oldPath)
			const shouldIgnoreNew = this.isPathIgnored(newDir) || this.isPathIgnored(item.path)

			if (shouldIgnoreOld && shouldIgnoreNew) {
				this.log.info(`Skipping rename event for ignored paths: ${oldPath} -> ${item.path}`)
				return
			} else if (shouldIgnoreOld && !shouldIgnoreNew) {
				this.log.info(`Item moved from ignored path to non-ignored: ${oldPath} -> ${item.path}`)
				this.orderManager.add(item)
				return
			} else if (!shouldIgnoreOld && shouldIgnoreNew) {
				this.log.info(`Item moved from non-ignored path to ignored: ${oldPath} -> ${item.path}`)
				this.orderManager.remove(oldPath)
				return
			}

			this.log.info(`Item renamed from '${oldPath}' to '${item.path}'`)
			this.orderManager.rename(oldPath, item.path)
		})

		this.app.vault.on('create', (item: TAbstractFile) => {
			if (this.isPathIgnored(item.path.substring(0, item.path.lastIndexOf('/')) || '/') || this.isPathIgnored(item.path)) return
			this.log.info(`Item created: '${item.path}'`)
			this.orderManager.add(item)
		})

		this.app.vault.on('delete', (item: TAbstractFile) => {
			if (this.isPathIgnored(item.path.substring(0, item.path.lastIndexOf('/')) || '/') || this.isPathIgnored(item.path)) return
			this.log.info(`Item deleted: '${item.path}'`)
			this.orderManager.remove(item.path)
		})
	}

	async loadSettings() {
		const savedSettings = (await this.loadData() || {}) as Partial<PluginSettings | LegacyPluginSettings>
		let settingsToLoad: PluginSettings
		if (savedSettings.customOrder?.['/'] && Array.isArray(savedSettings.customOrder['/'])) {
			this.log.info('Migrating settings to v4 format')
			settingsToLoad = this.migrateLegacySettings(savedSettings as LegacyPluginSettings)
		} else {
			settingsToLoad = savedSettings as PluginSettings
		}
		this.settings = {
			...DEFAULT_SETTINGS,
			...Object.fromEntries((Object.keys(DEFAULT_SETTINGS) as (keyof PluginSettings)[])
				.filter(k => k in settingsToLoad).map(k => [k, settingsToLoad[k]]),
			),
		}
		this.log.info('Settings loaded:', this.settings)
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.log.info('Settings saved:', this.settings)
	}

	async onExternalSettingsChange() {
		await this.loadSettings()
		this.log.warn('Settings changed externally')
		this.getFileExplorerView().sort()
	}

	migrateLegacySettings = (legacySettings: LegacyPluginSettings): PluginSettings => ({
		...legacySettings,
		customOrder: Object.fromEntries(Object.entries(legacySettings.customOrder).map(([folder, children]) => [folder, { children, sortOrder: 'custom' }])),
		sortOrder: legacySettings.sortOrder === 'customOrder' ? CUSTOM_SORT_ORDER_ID : legacySettings.sortOrder as SortOrder,
	})

	isCustomSortingActive = () =>
		this.settings.sortOrder === CUSTOM_SORT_ORDER_ID

	getFileExplorerView = () =>
		this.app.workspace.getLeavesOfType('file-explorer')[0].view as FileExplorerView

	isPathIgnored(path: string): boolean {
		if (this.settings.ignorePaths[path]) {
			this.log.info(`Path '${path}' is explicitly ignored`)
			return true
		}

		const parts = path.split('/').filter(part => part)
		let currentPath = ''
		for (const part of parts) {
			currentPath = currentPath ? `${currentPath}/${part}` : part
			if (this.settings.ignorePaths[currentPath]) {
				this.log.info(`Path '${path}' is ignored because parent '${currentPath}' is ignored`)
				return true
			}
		}
		return false
	}
}