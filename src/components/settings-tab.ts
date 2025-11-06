import { App, PluginSettingTab, Setting } from 'obsidian'
import type ManualSortingPlugin from '@/plugin'
import { Logger } from '@/utils'

export class SettingsTab extends PluginSettingTab {
	constructor(app: App, public plugin: ManualSortingPlugin) {
		super(app, plugin)
	}

	display(): void {
		this.containerEl.empty()

		new Setting(this.containerEl)
			.setName('New item placement')
			.setDesc('Default new item placement.')
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