import type { LogLevel, LogMethod } from '@/types.d'

export class Logger {
	static logLevel: LogLevel = 'silent'

	constructor(private scope: string, private color: string) {}

	info = (...args: unknown[]) => this.log(this.scope, 'log', ...args)

	warn = (...args: unknown[]) => this.log(this.scope, 'warn', ...args)

	error = (...args: unknown[]) => this.log(this.scope, 'error', ...args)

	private log(scope: string, logMethod: LogMethod = 'log', ...message: unknown[]) {
		if (Logger.logLevel === 'silent') return
		const style = `color: ${this.color}; background: #212027; padding: 3px 3px; border-radius: 4px; font-size: 11px;`
		console[logMethod](`%c[ms/${scope}]`, style, ...message)
	}
}