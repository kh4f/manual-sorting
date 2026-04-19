import { App, ButtonComponent, Modal } from 'obsidian'

export class ResetOrderModal extends Modal {
	constructor(app: App, onSubmit: () => void) {
		super(app)
		this.setTitle('Manual Sorting')
		this.modalEl.addClass('manual-sorting-modal', 'mod-form')

		const modalContent = this.contentEl.createEl('div')
		modalContent.createEl('p', { text: `Reset custom order?` })

		const modalButtons = modalContent.createEl('div', { cls: 'modal-button-container' })
		new ButtonComponent(modalButtons)
			.setButtonText('Yep')
			.setCta()
			.onClick(() => {
				this.close()
				onSubmit()
			})
		new ButtonComponent(modalButtons)
			.setButtonText('Nope')
			.onClick(() => this.close())
	}
}

void `css
.menu-item[data-section='custom'] {
	.menu-item-icon:first-child { display: flex; }

	.dragging-enabled-checkbox {
		margin-bottom: -2px;
		input { margin: 0; }
	}

	.svg-icon.lucide-pin {
		transform: rotate(45deg);
		margin-bottom: -2px;
	}
}
`