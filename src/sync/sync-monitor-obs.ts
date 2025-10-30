//Sync monitor for the sync service Obsidian Sync.
//Tracks synchronization activity via the status of Obsidian's internal synchronization mechanism.
//Distinguishes local changes (edits by the user) from synchronization-related (external) changes.
//Displays its own sync status in the status bar - Sync: Active / Sync: Idle with a countdown
//timer.
//Sync activity can be queried directly with isSyncActive() or by calling awaitSyncInactive(),
//which waits for sync to return to idle or times out.
//Adds a test command for awaitSyncInactive().
//
//How many milliseconds of no file activity must pass before considering the sync to be idle again
//can be configured in the plugin settings.
//The 2-second timeout was sufficient on my desktop systems for files up to 5 MB in size - the
//largest size allowed by Obsidian Sync in the basic plan.
//
//The public isSyncActive() can be queried or the public awaitSyncInactive() can be called before
//doing operations that could interfere with sync operations. For example to avoid accidentally
//performing operations on a file while it is currently in a syncing state.
//
//In addition, onExternalSettingsChange() of the Obsidian API should be used to be notified when
//the settings (data.json) of one's own plugin have changed.
import {Plugin, Notice, StatusBarItem} from 'obsidian';

const WAIT_FOR_IDLE_TIMEOUT = 10000; //milliseconds

export class SyncMonitorObs {
	private plugin: Plugin;
	private sync_instance: any = null;
	private syncActive: boolean = true;
	private syncResetTimeout: number | null = null;
	private statusBarItem: StatusBarItem | null = null;
	private fileEventHandlers: Array<() => void> = [];
	private syncResetTime: number | null = null;
	private countdownInterval: number | null = null;
	private oldSyncStatus = ''

	constructor(plugin: Plugin) {
		this.plugin = plugin
		this.sync_instance = plugin.app.internalPlugins.plugins.sync.instance
		this.boundOnSyncStatusChanged = this.onSyncStatusChanged.bind(this);
	}

	public isEnabled() {
		return this.plugin.settings.syncMonitorObs;
	}

	public isSyncActive() {
		return this.syncActive;
	}

	public getWaitForIdleTimeout() {
		return WAIT_FOR_IDLE_TIMEOUT;
	}

	onload() {
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.updateStatusBar();

		this.setSyncActive(); //sync probably runs during Obsidian startup, so we default to active

		this.registerSyncStatusEvent();
		this.addCommands();
	}

	onunload() {
		this.unregisterSyncStatusEvent();

		if (this.syncResetTimeout) {
			clearTimeout(this.syncResetTimeout);
		}

		this.syncActive = false;
		this.syncResetTimeout = null;
		this.syncResetTime = null;

		this.stopCountdownInterval();
		this.statusBarItem?.remove();
	}

	private registerSyncStatusEvent() {
		this.sync_instance.on('status-change', this.boundOnSyncStatusChanged);
	}

	private unregisterSyncStatusEvent() {
		this.sync_instance.off('status-change', this.boundOnSyncStatusChanged);
	}

	private startCountdownInterval() {
		if (this.countdownInterval !== null) return;

		this.countdownInterval = window.setInterval(() => {
			this.updateStatusBar();
		}, 1000);
	}

	private stopCountdownInterval() {
		if (this.countdownInterval !== null) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}

	//sets syncActive, inits timers
	private setSyncActive() {
		const wasInactive = !this.syncActive;
		this.syncActive = true;

		if (wasInactive) this.startCountdownInterval();

		//reset the timeout
		if (this.syncResetTimeout !== null) {
			clearTimeout(this.syncResetTimeout);
		}

		const timeoutMs = this.plugin.settings.syncInactivityResetMs;
		this.syncResetTime = Date.now() + timeoutMs;

		this.syncResetTimeout = window.setTimeout(() => {
			this.syncActive = false;
			this.syncResetTimeout = null;
			this.syncResetTime = null;
			this.stopCountdownInterval();
			this.updateStatusBar();
		}, timeoutMs);

		this.updateStatusBar();
	}

	onSyncStatusChanged() {
		//this.sync_instance.syncStatus exists, even with a local vault, without
		//any sync service configured, the string is 'Uninitialized' in this case
		let newSyncStatus = this.sync_instance.syncStatus.toLowerCase();

		//process only if it has actually changed
		if(newSyncStatus !== this.oldSyncStatus) {

			//downloading versus uploading
			//deleting    versus deleting remote
			//renaming is deleting (remote) + down/uploading
			if(    newSyncStatus.includes('downloading')
			   || (newSyncStatus.includes('deleting') && !newSyncStatus.includes('remote'))) {
				this.setSyncActive();
			}

			this.plugin.log.info('syncStatus:', newSyncStatus, ', syncActive:', this.syncActive);
			this.oldSyncStatus = newSyncStatus;
		}
	}

	//update the status bar text
	private updateStatusBar() {
		if (!this.statusBarItem) return;

		if (!this.syncActive) {
			this.statusBarItem.setText('Sync: Idle');
		} else {
			let countdown = '';
			if (this.syncResetTime !== null) {
				const remainingMs = this.syncResetTime - Date.now();
				const seconds = Math.ceil(remainingMs / 1000);
				if (seconds > 0) {
					countdown = ` (${seconds}s)`;
				}
			}
			this.statusBarItem.setText(`Sync: Active${countdown}`);
		}
	}

	//async wait until sync is inactive (idle) or the given time has passed
	public async awaitSyncInactive(timeoutMs: number): Promise<void> {
		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			const interval = 100;

			const check = () => {
				if (!this.syncActive) {
					resolve();
				} else if (Date.now() - startTime > timeoutMs) {
					reject(new Error('Timeout waiting for sync to become inactive.'));
				} else {
					setTimeout(check, interval);
				}
			};

			check();
		});
	}

	//test command to manually trigger sync wait
	private addCommands() {
		this.plugin.addCommand({
			id: 'test-wait-sync-finish',
			name: 'Wait for Sync: Idle',
			callback: async () => {
				new Notice('Waiting for sync to become inactive (timeout: 10s)...');
				try {
					await this.awaitSyncInactive(WAIT_FOR_IDLE_TIMEOUT);
					new Notice('Sync is now inactive.');
				} catch (err) {
					new Notice('Timeout: Sync is still active.');
				}
			},
		});
	}
}
