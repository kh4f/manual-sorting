import { TFolder } from 'obsidian';
import { FileOrder, PluginData } from './types';
import { FileExplorerView } from 'obsidian-typings';
import ManualSortingPlugin from './main';


/**
 * The `OrderManager` class is responsible for managing the custom file order.
 * 
 * The custom file order is stored in the plugin's data storage and is updated
 * every time the order of files in the file explorer changes.
 * 
 * The custom file order is used to restore the order of files in the file 
 * explorer when the plugin is reloaded.
 */
export class FileOrderManager {
	private _customFileOrder: FileOrder;

	constructor(private plugin: ManualSortingPlugin) { }

	/**
	 * Saves the custom file order to the plugin's data storage.
	 * 
	 * Note: The `data` object is initialized as empty, because at the time 
	 * of the current version only `CustomFinedorder is stored there.`
	 * Preloading previously saved data is avoided to save time.
	 */
	private async _saveCustomOrder() {
		const data: PluginData = { customFileOrder: {}, draggingEnabled: this.plugin.draggingEnabled };
		data.customFileOrder = this._customFileOrder;
		await this.plugin.saveData(data);
	}

	private async _loadCustomOrder() {
		const defaultOrder = { customFileOrder: { "/": [] } };
		const data = Object.assign({}, defaultOrder, await this.plugin.loadData());
		await this._migrateDataToNewFormat(data);
		this._customFileOrder = data.customFileOrder;
		return this._customFileOrder;
	}

	private async _migrateDataToNewFormat(data: PluginData) {
		const keys = Object.keys(data);
		const otherKeys = keys.filter(key => key !== 'customFileOrder');

		if (otherKeys.length > 0) {
			for (const key of otherKeys) {
				data.customFileOrder[key] = data[key];
				delete data[key];
			}
		}
	}

	async initOrder() {
		await this._loadCustomOrder();
		await this.updateOrder();
	}

	resetOrder() {
		this._customFileOrder = { "/": [] };
		this._saveCustomOrder();
	}

	async updateOrder() {
		console.log("Updating order...");
		const currentOrder = await this._getCurrentOrder();
		const savedOrder = this._customFileOrder;
		const newOrder = await this._matchSavedOrder(currentOrder, savedOrder);
		this._customFileOrder = newOrder;
		this._saveCustomOrder();
		console.log("Order updated:", this._customFileOrder);
	}

	private async _getCurrentOrder() {
		const currentData: { [folderPath: string]: string[] } = {};
		const explorerView = this.plugin.app.workspace.getLeavesOfType("file-explorer")[0]?.view as FileExplorerView;

		const indexFolder = (folder: TFolder) => {
			const sortedItems = explorerView.getSortedFolderItems(folder);
			const sortedItemPaths = sortedItems.map((item) => item.file.path);
			currentData[folder.path] = sortedItemPaths;

			for (const item of sortedItems) {
				const itemObject = item.file;
				if (itemObject instanceof TFolder) {
					indexFolder(itemObject);
				}
			}
		};

		indexFolder(this.plugin.app.vault.root);
		return currentData;
	}

	private async _matchSavedOrder(currentOrder: FileOrder, savedOrder: FileOrder) {
		let result: FileOrder = {};

		for (let folder in currentOrder) {
			if (savedOrder[folder]) {
				let prevOrder = savedOrder[folder];
				let currentFiles = currentOrder[folder];
				// Leave the files that have already been saved
				let existingFiles = prevOrder.filter(file => currentFiles.includes(file));
				// Add new files to the beginning of the list
				let newFiles = currentFiles.filter(file => !prevOrder.includes(file));
				// Combine and remove duplicates
				result[folder] = Array.from(new Set([...newFiles, ...existingFiles]));
			} else {
				// Remove duplicates from current folder
				result[folder] = Array.from(new Set(currentOrder[folder]));
			}
		}

		return result;
	}

	async moveFile(oldPath: string, newPath: string, newDraggbleIndex: number) {
		console.log(`Moving from "${oldPath}" to "${newPath}" at index ${newDraggbleIndex}`);
		const data = this._customFileOrder;
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf("/")) || "/";
		const newDir = newPath.substring(0, newPath.lastIndexOf("/")) || "/";

		if (data[oldDir]) {
			data[oldDir] = data[oldDir].filter(item => item !== oldPath);
		} else {
			console.warn(`[moveFile] folder "${oldDir}" not found in data.`);
		}

		if (data[newDir].includes(newPath)) {
			console.warn(`[moveFile] "${newPath}" already exists in "${newDir}". Removing it from "${oldDir}" and returning.`);
			return;
		}

		data[newDir].splice(newDraggbleIndex, 0, newPath);

		this._saveCustomOrder();
	}

	async renameItem(oldPath: string, newPath: string) {
		if (oldPath === newPath) return;
		console.log(`Renaming "${oldPath}" to "${newPath}"`);
		const data = this._customFileOrder;
		const oldDir = oldPath.substring(0, oldPath.lastIndexOf("/")) || "/";

		if (data[oldDir]) {
			data[oldDir] = data[oldDir].map(item => (item === oldPath ? newPath : item));
		} else {
			console.warn(`[renameItem] folder "${oldDir}" not found in data.`);
		}

		const itemIsFolder = !!data[oldPath];
		if (itemIsFolder) {
			console.log(`[renameItem] "${oldPath}" is a folder. Renaming its children as well.`);
			data[newPath] = data[oldPath];
			delete data[oldPath];
			data[newPath] = data[newPath].map(item => item.replace(oldPath, newPath));
		}

		this._saveCustomOrder();
	}

	async restoreOrder(container: Element, folderPath: string) {
		const savedData = this._customFileOrder;
		console.log(`Restoring order for "${folderPath}"`);
		const savedOrder = savedData?.[folderPath];
		if (!savedOrder) return;

		const explorer = await this.plugin.waitForExplorer();
		const scrollTop = explorer.scrollTop;

		const itemsByPath = new Map<string, Element>();
		Array.from(container.children).forEach((child: Element) => {
			const path = child.firstElementChild?.getAttribute("data-path");
			if (path) {
				itemsByPath.set(path, child);
			}
		});

		const fragment = document.createDocumentFragment();
		savedOrder.forEach((path: string) => {
			const element = itemsByPath.get(path);
			if (element) {
				fragment.appendChild(element);
			}
		});

		container.appendChild(fragment);
		explorer.scrollTop = scrollTop;
		console.log(`Order restored for "${folderPath}"`);
	}

	getFlattenPaths() {
		function flattenPaths(obj: { [key: string]: string[] }, path: string = "/"): string[] {
			let result = [];

			if (obj[path]) {
				for (const item of obj[path]) {
					result.push(item);
					if (obj[item]) {
						result.push(...flattenPaths(obj, item));
					}
				}
			}
			return result;
		}

		return flattenPaths(this._customFileOrder);
	}
}

