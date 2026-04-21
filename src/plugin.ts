import { Plugin, TAbstractFile } from 'obsidian'
import { OrderManager, Patcher, ExplorerManager, DndManager } from '@/managers'
import type { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/constants'
import { getFileExplorerView, initLog, logger } from '@/utils'
import { SettingsTab } from '@/ui/settings-tab'
import { mountToolbar } from '@/ui/toolbar'

export default class ManualSortingPlugin extends Plugin {
	public orderManager = new OrderManager(this)
	private patcher = new Patcher(this)
	public explorerManager = new ExplorerManager(this)
	public dndManager = new DndManager(this)
	private log = initLog('CORE', '#ff4828')
	public settings!: Settings

	async onload() {
		await this.loadSettings()
		logger.level = this.settings.debugMode ? 'debug' : 'silent'
		if (process.env.DEV) this.log('Loading Manual Sorting in dev mode')
		this.addSettingTab(new SettingsTab(this.app, this))
		this.app.workspace.onLayoutReady(() => this.initialize())
	}

	onunload() {
		this.explorerManager.disconnect()
		this.patcher.unpatchExplorer()
		this.dndManager.disable()
		getFileExplorerView().sort()
		this.log('Manual Sorting unloaded')
	}

	async initialize() {
		await this.explorerManager.waitForExplorerElement()
		this.patcher.patchExplorer()
		this.explorerManager.refreshExplorer()
		this.explorerManager.refreshExplorerOnMount()
		this.registerVaultHandlers()
		mountToolbar(this)
	}

	registerVaultHandlers() {
		this.app.vault.on('rename', (item: TAbstractFile, oldPath: string) => {
			const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
			const newDir = item.path.substring(0, item.path.lastIndexOf('/')) || '/'
			if (oldDir !== newDir) return
			this.log(`Item renamed from '${oldPath}' to '${item.path}'`)
			this.orderManager.rename(oldPath, item.path)
		})

		this.app.vault.on('create', (item: TAbstractFile) => {
			this.log(`Item created: '${item.path}'`)
			this.orderManager.add(item)
		})

		this.app.vault.on('delete', (item: TAbstractFile) => {
			this.log(`Item deleted: '${item.path}'`)
			this.orderManager.remove(item.path)
		})
	}

	async loadSettings() {
		const savedSettings = (await this.loadData() || {}) as Partial<Settings>
		this.settings = {
			...DEFAULT_SETTINGS,
			...Object.fromEntries((Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[])
				.filter(k => k in savedSettings).map(k => [k, savedSettings[k]]),
			),
		}
		this.log('Settings loaded:', this.settings)
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.log('Settings saved:', this.settings)
	}

	async onExternalSettingsChange() {
		await this.loadSettings()
		this.log('Settings changed externally')
		getFileExplorerView().sort()
	}
}