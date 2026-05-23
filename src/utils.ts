type LogLevel = 'debug' | 'silent'
type LogType = 'log' | 'warn' | 'error'

export const cn = (...cls: unknown[]) => cls.filter(Boolean).join(' ')

export const logger = { level: 'silent' as LogLevel }

const LOG_TYPES = new Set<LogType>(['log', 'warn', 'error'])

export const initLog = (scope: string, color: string) => (...args: unknown[]) => {
	if (logger.level === 'silent') return
	const method: LogType = isLogType(args.at(-1)) ? args.pop() as LogType : 'log'
	const prefix = `%cFP${scope ? `|${scope}` : ''}`
	// eslint-disable-next-line obsidianmd/rule-custom-message
	return console[method](prefix, buildStyles(color), ...args)
}

const isLogType = (value: unknown): value is LogType => typeof value === 'string' && LOG_TYPES.has(value as LogType)

const buildStyles = (color: string) => `
	color: ${color};
	background: #1d2131;
	padding: 0px 4px;
	border-radius: 10px;
	font-family: consolas, monospace;
	font-size: 11px;
	border: 1px solid ${color}50;
`