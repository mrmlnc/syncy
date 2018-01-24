import * as assert from 'assert';

import LogManager, { ILogEntry } from './log';

import * as optionsManager from './options';

import { IOptions, IPartialOptions } from './options';

class FakeLogger extends LogManager {
	public lastMessage: string;

	public log(message: string): void {
		this.lastMessage = message;
	}
}

function getLogger(options?: IPartialOptions): FakeLogger {
	const preparedOptions: IOptions = optionsManager.prepare(options);

	return new FakeLogger(preparedOptions);
}

function getLogEntry(entry?: Partial<ILogEntry>): ILogEntry {
	return Object.assign<ILogEntry, Partial<ILogEntry> | undefined>({
		action: 'copy',
		from: 'from',
		to: 'to'
	}, entry);
}

describe('Managers → Logger', () => {
	describe('Constructor', () => {
		it('should create instance of class', () => {
			const logger = getLogger();

			assert.ok(logger instanceof LogManager);
		});
	});

	describe('.info', () => {
		it('should do nothing when the «verbose» option is disabled', () => {
			const logger = getLogger({ verbose: false });

			const expected: undefined = undefined;

			const logEntry = getLogEntry();

			logger.info(logEntry);

			const actual = logger.lastMessage;

			assert.equal(actual, expected);
		});

		it('should do use default logger with «copy» action when the «verbose» option is enabled', () => {
			const logger = getLogger({ verbose: true });

			const expected: string = 'Copying: from -> to';

			const logEntry = getLogEntry();

			logger.info(logEntry);

			const actual = logger.lastMessage;

			assert.equal(actual, expected);
		});

		it('should do use default logger with «remove» action when the «verbose» option is enabled', () => {
			const logger = getLogger({ verbose: true });

			const expected: string = 'Removing: from';

			const logEntry = getLogEntry({ action: 'remove' });

			logger.info(logEntry);

			const actual = logger.lastMessage;

			assert.equal(actual, expected);
		});

		it('should do use custom logger when the «verbose» option is function', () => {
			let message: string;

			const logger = getLogger({
				verbose: (entry) => message = entry.action
			});

			const expected: string = 'copy';

			const logEntry = getLogEntry();

			logger.info(logEntry);

			/* tslint:disable-next-line no-non-null-assertion */
			const actual = message!;

			assert.equal(actual, expected);
		});
	});
});
