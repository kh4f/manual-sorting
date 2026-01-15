import type { LogLevel, LogMethod } from '@/types'

export class Logger {
	static logLevel: LogLevel = 'silent'
	private style: string
	private prefix: string

	constructor(private scope: string, private color: string) {
		this.style = `color: ${this.color}; background: #21202a; padding: 1px 5px; border-radius: 5px; font-family: consolas, monospace; font-size: 11px; border: 1px solid ${this.color}50;`
		this.prefix = `%cMS|${this.scope}`
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