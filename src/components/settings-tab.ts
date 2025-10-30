import { App, PluginSettingTab, Setting, sanitizeHTMLToDom } from 'obsidian'
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

		const WAIT_FOR_IDLE_TIMEOUT = this.plugin.syncMonitorObs.getWaitForIdleTimeout()
		const syncInactivityResetMsDescr: DocumentFragment = sanitizeHTMLToDom(
			  'Milliseconds of inactivity before sync is considered finished.'
			+ '<br>'
			+ `Min. 0, max. ${WAIT_FOR_IDLE_TIMEOUT} milliseconds.` //must be backticks here
		)

		new Setting(this.containerEl)
			.setName('Obsidian Sync support (experimental)')
			.setDesc('Monitor sync activity and suspend saving of sort order during sync.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.syncMonitorObs)
				.onChange(async (value) => {
					this.plugin.settings.syncMonitorObs = value
					if (value) {
						this.plugin.syncMonitorObs.onload() //sets syncActive
					}
					else {
						this.plugin.syncMonitorObs.onunload()
					}

					//wait for sync idle, no save otherwise when switched on, due to onload above
					await this.plugin.syncMonitorObs.awaitSyncInactive(WAIT_FOR_IDLE_TIMEOUT)
					await this.plugin.saveSettings()
				}),
			)

		new Setting(this.containerEl)
			.setName('Sync inactivity reset timeout')
			.setDesc(syncInactivityResetMsDescr)
			.addText(text => {
				let tmpVal = ''
				text
					.setPlaceholder('2000')
					.setValue(this.plugin.settings.syncInactivityResetMs.toString())
					.onChange(value => {
						//just update temp value, no saving yet
						tmpVal = value
					});
				//save only when editing is done, when user clicks away from the field
				text.inputEl.addEventListener('blur', async () => {
					console.log(tmpVal)
					let parsedInt = parseInt(tmpVal)
					if (isNaN(parsedInt)) parsedInt = this.plugin.settings.syncInactivityResetMs //keep old value
					if (parsedInt < 0) parsedInt = 0
					if (parsedInt > WAIT_FOR_IDLE_TIMEOUT) parsedInt = WAIT_FOR_IDLE_TIMEOUT
					text.setValue(parsedInt.toString()) //display final value taken over
					this.plugin.settings.syncInactivityResetMs = parsedInt
					await this.plugin.saveSettings();
				});
			});
	}
}