import { App, PluginSettingTab, Setting } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import { logger } from '@/utils'

export class SettingsTab extends PluginSettingTab {
	constructor(app: App, public plugin: ManualSortingPlugin) {
		super(app, plugin)
	}

	display(): void {
		this.containerEl.empty()

		new Setting(this.containerEl)
			.setName('New item placement')
			.setDesc('Default placement for new items inside a folder')
			.addDropdown(dropdown => dropdown
				.addOption('top', 'Top')
				.addOption('bottom', 'Bottom')
				.setValue(this.plugin.settings.newItemPlacement)
				.onChange(async value => {
					this.plugin.settings.newItemPlacement = value as 'top' | 'bottom'
					await this.plugin.saveSettings()
				}),
			)

		new Setting(this.containerEl)
			.setName('Show child counter')
			.setDesc('Display item count next to folder names')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showChildCounter)
				.onChange(async showChildCounter => {
					this.plugin.settings.showChildCounter = showChildCounter
					await this.plugin.saveSettings()
					this.plugin.explorerManager.refreshFolderIndicators()
				}),
			)

		new Setting(this.containerEl)
			.setName('Debug mode')
			.setDesc('Show debug logs in the console')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debugMode)
				.onChange(async enableDebugMode => {
					this.plugin.settings.debugMode = enableDebugMode
					logger.level = enableDebugMode ? 'debug' : 'silent'
					await this.plugin.saveSettings()
				}),
			)
	}
}