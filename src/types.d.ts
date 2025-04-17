import { TAbstractFile } from "obsidian";


export interface PluginData {
	customFileOrder: FileOrder;
	draggingEnabled: boolean;
	[otherKey: string]: any;
}

export interface FileOrder {
	[folderPath: string]: string[];
}

declare module 'obsidian-typings' {
	interface FileExplorerView {
		onRename(file: TAbstractFile, oldPath: string): void;
		updateShowUnsupportedFiles(): void;
	}
}
