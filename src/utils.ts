import type { FileExplorerView } from 'obsidian-typings'

type LogLevel = 'debug' | 'silent'
type LogMethod = 'log' | 'warn' | 'error' | 'group'

export const logger = { level: 'silent' as LogLevel }

export const log = (...args: unknown[]) => $log(`%cMS`, buildStyle('#00ccff'), ...args)
export const initLog = (scope: string, color: string) => (...args: unknown[]) => $log(`%cMS|${scope}`, buildStyle(color), ...args)

export const cn = (...cls: unknown[]) => cls.filter(Boolean).join(' ')

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const getFileExplorerView = () => app.workspace.getLeavesOfType('file-explorer')[0].view as FileExplorerView

const $log = (...args: unknown[]) => {
	if (logger.level === 'silent') return
	const method = ['log', 'warn', 'error', 'group'].some(m => args.at(-1) === m) ? args.pop() as LogMethod : 'log'
	if (method !== 'group') return console[method](...args)
	console.groupCollapsed(...args.splice(0, 3))
	console.log(...args)
	console.groupEnd()
}

const buildStyle = (color: string) => `color: ${color};
	background: #1d2131;
	padding: 1px 5px;
	border-radius: 5px;
	font-family: consolas, monospace;
	font-size: 11px;
	border: 1px solid ${color}50;`