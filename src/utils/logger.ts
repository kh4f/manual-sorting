import type { LogLevel, LogMethod } from '@/types.d'

export class Logger {
	static logLevel: LogLevel = 'silent'
	private style: string
	private prefix: string

	constructor(private scope: string, private color: string) {
		this.style = `color: ${this.color}; background: #212027; padding: 3px 3px; border-radius: 4px; font-size: 11px;`
		this.prefix = `%c[ms/${this.scope}]`
	}

	info = (...args: unknown[]) => this.log('log', ...args)

	warn = (...args: unknown[]) => this.log('warn', ...args)

	error = (...args: unknown[]) => this.log('error', ...args)

	infoCompact = (label: string, ...args: unknown[]) => {
		if (Logger.logLevel === 'silent') return
		console.groupCollapsed(this.prefix, this.style, label)
		console.log(...args)
		console.groupEnd()
	}

	private log(logMethod: LogMethod = 'log', ...args: unknown[]) {
		if (Logger.logLevel === 'silent') return
		console[logMethod](this.prefix, this.style, ...args)
	}
}