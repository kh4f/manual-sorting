import { IconName, TAbstractFile } from "obsidian";


export interface PluginSettings {
	customFileOrder: FileOrder;
	selectedSortOrder: string;
	draggingEnabled: boolean;
}

export interface FileOrder {
	[folderPath: string]: string[];
}

declare module 'obsidian-typings' {
	interface FileExplorerView {
		autoRevealButtonEl: HTMLDivElement;
		headerDom: {
			addNavButton(icon: IconName, title: string, callback: (evt: MouseEvent) => any): HTMLElement;
		};
		onRename(file: TAbstractFile, oldPath: string): void;
		updateShowUnsupportedFiles(): void;
		sortOrder: string;
	}
}
