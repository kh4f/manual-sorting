import { App, PluginSettingTab, Setting } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils/logger'

export class SettingsTab extends PluginSettingTab {
	constructor(app: App, public plugin: ManualSortingPlugin) {
		super(app, plugin)
	}

	display(): void {
		this.containerEl.empty()

		new Setting(this.containerEl)
			.setName('New items position')
			.setDesc('Position of newly created items in a folder.')
			.addDropdown(dropdown => dropdown
				.addOption('top', 'Top')
				.addOption('bottom', 'Bottom')
				.setValue(this.plugin.settings.newItemsPosition)
				.onChange(async value => {
					this.plugin.settings.newItemsPosition = value as 'top' | 'bottom'
					await this.plugin.saveSettings()
				}),
			)

		new Setting(this.containerEl)
			.setName('Debug Mode')
			.setDesc('Show debug logs in the console.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debugMode)
				.onChange(async enableDebugMode => {
					this.plugin.settings.debugMode = enableDebugMode
					Logger.logLevel = enableDebugMode ? 'debug' : 'silent'
					await this.plugin.saveSettings()
				}),
			)
	}
}