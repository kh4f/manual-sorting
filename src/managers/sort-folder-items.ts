import { TFile } from 'obsidian'
import type { FileTreeItem } from 'obsidian-typings'
import type { SortOrder } from '@/types'

const isFolder = (item: FileTreeItem) => !(item.file instanceof TFile)

const compareNames = (a: FileTreeItem, b: FileTreeItem) =>
	a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })

const compareNumbers = (a: number, b: number) => a - b

const getCreatedTime = (item: FileTreeItem) =>
	item.file instanceof TFile ? item.file.stat.ctime : Number.NaN

const getModifiedTime = (item: FileTreeItem) =>
	item.file instanceof TFile ? item.file.stat.mtime : Number.NaN

const withNameFallback = (result: number, a: FileTreeItem, b: FileTreeItem) =>
	result !== 0 ? result : compareNames(a, b)

const withFoldersFirst = (compareItems: (a: FileTreeItem, b: FileTreeItem) => number) =>
	(a: FileTreeItem, b: FileTreeItem) => {
		const aIsFolder = isFolder(a)
		const bIsFolder = isFolder(b)

		if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1
		return compareItems(a, b)
	}

const withPinnedFirst = (
	isPinned: (path: string) => boolean,
	compareItems: (a: FileTreeItem, b: FileTreeItem) => number,
) => (a: FileTreeItem, b: FileTreeItem) => {
	const aIsPinned = isPinned(a.file.path)
	const bIsPinned = isPinned(b.file.path)

	if (aIsPinned !== bIsPinned) return aIsPinned ? -1 : 1
	return compareItems(a, b)
}

const compareByCustomOrder = (children: string[]) => {
	const orderIndex = new Map(children.map((path, index) => [path, index]))

	return (a: FileTreeItem, b: FileTreeItem) => {
		const indexA = orderIndex.get(a.file.path) ?? Number.MAX_SAFE_INTEGER
		const indexB = orderIndex.get(b.file.path) ?? Number.MAX_SAFE_INTEGER
		return withNameFallback(compareNumbers(indexA, indexB), a, b)
	}
}

const compareByTimestamp = (
	getTimestamp: (item: FileTreeItem) => number,
	direction: 'asc' | 'desc',
) => (a: FileTreeItem, b: FileTreeItem) => {
	const timeA = getTimestamp(a)
	const timeB = getTimestamp(b)
	const hasTimeA = Number.isFinite(timeA)
	const hasTimeB = Number.isFinite(timeB)

	if (!hasTimeA && !hasTimeB) return compareNames(a, b)
	if (!hasTimeA) return 1
	if (!hasTimeB) return -1

	const result = compareNumbers(timeA, timeB)
	return withNameFallback(direction === 'asc' ? result : -result, a, b)
}

export const sortFolderItems = (
	items: FileTreeItem[],
	sortOrder: SortOrder,
	children: string[],
	isPinned: (path: string) => boolean,
) => {
	const sortedItems = [...items]

	switch (sortOrder) {
		case 'alphabetical':
			return sortedItems.sort(withPinnedFirst(isPinned, withFoldersFirst(compareNames)))
		case 'alphabeticalReverse':
			return sortedItems.sort(withPinnedFirst(isPinned, withFoldersFirst((a, b) => compareNames(b, a))))
		case 'byCreatedTime':
			return sortedItems.sort(withPinnedFirst(isPinned, withFoldersFirst(compareByTimestamp(getCreatedTime, 'asc'))))
		case 'byCreatedTimeReverse':
			return sortedItems.sort(withPinnedFirst(isPinned, withFoldersFirst(compareByTimestamp(getCreatedTime, 'desc'))))
		case 'byModifiedTime':
			return sortedItems.sort(withPinnedFirst(isPinned, withFoldersFirst(compareByTimestamp(getModifiedTime, 'asc'))))
		case 'byModifiedTimeReverse':
			return sortedItems.sort(withPinnedFirst(isPinned, withFoldersFirst(compareByTimestamp(getModifiedTime, 'desc'))))
		default:
			return sortedItems.sort(withPinnedFirst(isPinned, compareByCustomOrder(children)))
	}
}