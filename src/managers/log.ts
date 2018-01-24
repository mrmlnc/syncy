import chalk from 'chalk';

import { IOptions } from './options';

export interface ILogEntry {
	action: 'copy' | 'remove';
	from: string;
	to?: string;
}

export type Log = (entry: ILogEntry) => void;

export default class LogManager {
	private logger: Log;

	constructor(private readonly options: IOptions) {
		this.logger = this.getLogger();
	}

	public info(entry: ILogEntry): void {
		this.logger(entry);
	}

	public log(message: string): void {
		console.log(message);
	}

	private getLogger(): Log {
		if (this.options.verbose === true) {
			return this.defaultLogger;
		}
		if (typeof this.options.verbose === 'function') {
			return this.options.verbose;
		}

		return () => undefined;
	}

	private defaultLogger(entry: ILogEntry): void {
		const message = this.formatMessage(entry);

		this.log(message);
	}

	private formatMessage(entry: ILogEntry): string {
		if (entry.action === 'remove') {
			return chalk.red('Removing: ') + entry.from;
		}

		return chalk.red('Copying: ') + `${entry.from} -> ${entry.to}`;
	}
}
