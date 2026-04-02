type LogLevel = 'debug' | 'silent'
type LogMethod = 'log' | 'warn' | 'error' | 'group'

export const logger = { level: 'silent' as LogLevel }

export const log = (...args: unknown[]) => $log(`%cMS`, buildStyle('#00ccff'), ...args)
export const initLog = (scope: string, color: string) => (...args: unknown[]) => $log(`%cMS|${scope}`, buildStyle(color), ...args)

const $log = (...args: unknown[]) => {
	if (logger.level === 'silent') return
	const method = ['log', 'warn', 'error', 'group'].some(m => args.at(-1) === m) ? args.pop() as LogMethod : 'log'
	if (method !== 'group') return console[method](...args)
	console.groupCollapsed(args.shift())
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