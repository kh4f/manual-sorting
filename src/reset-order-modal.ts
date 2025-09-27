import { App, ButtonComponent, Modal } from 'obsidian';

export class ResetOrderModal extends Modal {
    constructor(app: App, prevSelectedSortOrder: string, onSubmit: () => void) {
        super(app);
        this.setTitle("Manual sorting");
        this.modalEl.addClass("manual-sorting-modal");

        const modalContent = this.contentEl.createEl("div");
		modalContent.createEl("p", { text: `Reset custom order to match previously selected one (${prevSelectedSortOrder})?` });
        const modalButtons = modalContent.createEl("div", { cls: "modal-buttons" });
        new ButtonComponent(modalButtons)
            .setButtonText("Yep")
            .setCta()
            .onClick(() => {
                this.close();
                onSubmit();
            });

        new ButtonComponent(modalButtons)
            .setButtonText("Cancel")
            .onClick(() => this.close());
    }
}
