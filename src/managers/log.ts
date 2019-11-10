import { Options } from './options';

export type LogEntry = {
	action: 'copy' | 'remove';
	from: string;
	to?: string;
};

export type Log = (entry: LogEntry) => void;

export default class LogManager {
	private readonly _logger: Log;

	constructor(private readonly _options: Options) {
		this._logger = this._getLogger();
	}

	public info(entry: LogEntry): void {
		this._logger(entry);
	}

	public log(message: string): void {
		console.log(message);
	}

	private _getLogger(): Log {
		if (this._options.verbose === true) {
			return this._defaultLogger;
		}

		if (typeof this._options.verbose === 'function') {
			return this._options.verbose;
		}

		return () => undefined;
	}

	private _defaultLogger(entry: LogEntry): void {
		const message = this._formatMessage(entry);

		this.log(message);
	}

	private _formatMessage(entry: LogEntry): string {
		if (entry.action === 'remove') {
			return `Removing: ${entry.from}`;
		}

		return `Copying: ${entry.from} -> ${entry.to}`;
	}
}
