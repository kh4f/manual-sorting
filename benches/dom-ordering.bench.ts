import { bench, describe } from 'vitest'
import { createElementArray, createContainer, loadElementsRandomly, assertOrder } from './bench-utils'

describe.for([10, 100, 500, 1000])('DOM element ordering strategies ($0 elements)', totalElements => {
	const expectedOrder = Array.from({ length: totalElements }, (_, i) => String(i)).sort(() => Math.random() - 0.5)

	bench('incremental insertion during load', () => {
		const container = createContainer()
		const elements = createElementArray(totalElements)

		loadElementsRandomly(elements, el => {
			// find the next sibling in the desired order and insert before it
			const nextSibling = [...container.children].find(c => expectedOrder.indexOf(c.id) > expectedOrder.indexOf(el.id)) ?? null
			container.insertBefore(el, nextSibling)
		})

		assertOrder(container, expectedOrder)
		document.body.innerHTML = ''
	})

	bench('post-processing reordering', () => {
		const container = createContainer()
		const elements = createElementArray(totalElements)

		// just append the element to the container as it's loaded
		loadElementsRandomly(elements, el => container.appendChild(el))

		expectedOrder.forEach(id => {
			const el = document.getElementById(id)
			if (el) container.appendChild(el)
		})

		assertOrder(container, expectedOrder)
		document.body.innerHTML = ''
	})

	bench('post-processing reordering with DocumentFragment', () => {
		const container = createContainer()
		const elements = createElementArray(totalElements)

		// just append the element to the container as it's loaded
		loadElementsRandomly(elements, el => container.appendChild(el))

		const fragment = document.createDocumentFragment()
		expectedOrder.forEach(id => {
			const el = document.getElementById(id)
			if (el) fragment.appendChild(el)
		})
		container.appendChild(fragment)

		assertOrder(container, expectedOrder)
		document.body.innerHTML = ''
	})
})