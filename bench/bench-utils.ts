import { expect } from 'vitest'

export const createElementArray = (totalElements: number) => Array.from({ length: totalElements }, (_, i) =>
	Object.assign(document.createElement('div'), { id: String(i) }),
)

export const createContainer = () => document.body.appendChild(document.createElement('div'))

export const loadElementsRandomly = (elements: HTMLElement[], insertFn: (el: HTMLElement) => void) => {
	const loadingElements = [...elements]
	while (loadingElements.length) {
		const el = loadingElements.splice(Math.floor(Math.random() * loadingElements.length), 1)[0]
		insertFn(el)
	}
}

export const assertOrder = (container: HTMLElement, expectedOrder: string[]) => {
	const actualOrder = [...container.children].map(c => c.id)
	expect(actualOrder).toEqual(expectedOrder)
}