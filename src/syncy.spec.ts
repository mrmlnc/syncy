'use strict';

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import * as cpf from 'cp-file';
import * as recursiveReaddir from 'recursive-readdir';

import * as fsUtils from './utils/fs';

import syncy, { compareTime, skipUpdate } from './syncy';

import { LogEntry } from './managers/log';

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

// Creating test files
async function createFiles(filepath: string, count: number): Promise<void> {
	await fsUtils.makeDirectory(filepath);

	for (let i = 0; i < count; i++) {
		await writeFile(path.join(filepath, `test-${i}.txt`), 'test');
	}
}

// Look ma, it's cp -R
async function copyRecursive(source: string, dest: string): Promise<void> {
	const files = await recursiveReaddir(source);

	const promises = files.map((filepath: string) => cpf(filepath, path.join(dest, filepath)));

	await Promise.all(promises);
}

describe('Syncy', () => {
	describe('.compareTime', () => {
		it('should return true if second date bigger then first', () => {
			assert.ok(compareTime({ ctime: new Date(10 * 1000) } as fs.Stats, { ctime: new Date(100 * 1000) } as fs.Stats));
		});

		it('should return false is first date bigger then second', () => {
			assert.ok(!compareTime({ ctime: new Date(100 * 1000) } as fs.Stats, { ctime: new Date(10 * 1000) } as fs.Stats));
		});
	});

	describe('.skipUpdate', () => {
		it('should return true if source is directory', () => {
			const source = {
				isDirectory: () => true
			} as fs.Stats;

			const dest = {} as fs.Stats;

			assert.ok(skipUpdate(source, dest, true /* updateAndDelete */));
		});

		it('should return false if dest is outdated', () => {
			const source = {
				isDirectory: () => false,
				ctime: new Date(100 * 1000)
			} as fs.Stats;

			const dest = {
				ctime: new Date(10 * 1000)
			} as fs.Stats;

			assert.ok(!skipUpdate(source, dest, true /* updateAndDelete */));
		});

		it('should return true if «updateAndDelete» is disabled', () => {
			const source = {} as fs.Stats;
			const dest = {} as fs.Stats;

			assert.ok(skipUpdate(source, dest, false /* updateAndDelete */));
		});

		it('should return true if «updateAndDelete» is enabled and dest is up-to-date', () => {
			const source = {
				isDirectory: () => false,
				ctime: new Date(10 * 1000)
			} as fs.Stats;

			const dest = {
				ctime: new Date(100 * 1000)
			} as fs.Stats;

			assert.ok(skipUpdate(source, dest, true /* updateAndDelete */));
		});

		it('should return true if dest is up-to-date', () => {
			const source = {
				isDirectory: () => false,
				ctime: new Date(10 * 1000)
			} as fs.Stats;

			const dest = {
				ctime: new Date(100 * 1000)
			} as fs.Stats;

			assert.ok(skipUpdate(source, dest, true /* updateAndDelete */));
		});
	});

	describe('Basic tests', () => {
		it('basic-0: Should create destination directory if it does not exist', () => {
			return syncy('test/**/*', '.tmp/basic-0').then(() => {
				return fsUtils.pathExists('.tmp/basic-0').then((status) => {
					assert.ok(status);
				});
			});
		});

		it('basic-1: Should just copy files', () => {
			return syncy('fixtures/**/*', '.tmp/basic-1')
				.then(() => recursiveReaddir('.tmp/basic-1'))
				.then((result) => {
					assert.equal(result.length, 8);
				});
		});

		it('basic-2: Should just copy files without `base` option in paths', () => {
			return syncy('fixtures/**', '.tmp/basic-2', { base: 'fixtures' })
				.then(() => recursiveReaddir('.tmp/basic-2'))
				.then((result) => {
					assert.equal(result.length, 8);
				});
		});

		it('basic-3: Removing files', () => {
			return createFiles('.tmp/basic-2/fixtures', 3)
				.then(() => syncy('fixtures/**', '.tmp/basic-3'))
				.then(() => recursiveReaddir('.tmp/basic-3'))
				.then((result) => {
					assert.equal(result.length, 8);
				});
		});

		it('basic-4: Skipping files', () => {
			return syncy('fixtures/**', '.tmp/basic-4')
				.then(() => syncy('fixtures/**', '.tmp/basic-4'))
				.then(() => recursiveReaddir('.tmp/basic-4'))
				.then((result) => {
					assert.equal(result.length, 8);
				});
		});
	});

	describe('Updating files', () => {
		it('updating-0: Remove file in `dest` directory', () => {
			return syncy('fixtures/**', '.tmp/updating-0')
				// Remove one file in the destination directory
				.then(() => fsUtils.removeFile('.tmp/updating-0/fixtures/folder-1/test.txt', { disableGlob: true }))
				.then(() => syncy('fixtures/**', '.tmp/updating-0'))
				.then(() => recursiveReaddir('.tmp/updating-0'))
				.then((result) => {
					assert.equal(result.length, 8);
				});
		});

		it('updating-1: Remove file in `src` directory', () => {
			// Backup test files
			return copyRecursive('fixtures', '.tmp/fixtures-backup')
				.then(() => syncy('.tmp/fixtures-backup/**', '.tmp/updating-1'))
				// Remove one file in the source directory
				.then(() => fsUtils.removeFile('.tmp/fixtures-backup/fixtures/folder-1/test.txt', { disableGlob: true }))
				.then(() => syncy('.tmp/fixtures-backup/**', '.tmp/updating-1'))
				.then(() => recursiveReaddir('.tmp/updating-1'))
				.then((result) => {
					assert.equal(result.length, 7);
				});
		});

		it('updating-2: Remove file in `src` (with `**/*` pattern)', () => {
			// Backup test files
			return copyRecursive('fixtures', '.tmp/fixtures-backup')
				.then(() => syncy('.tmp/fixtures-backup/**', '.tmp/updating-2'))
				// Remove one file in the source directory
				.then(() => fsUtils.removeFile('.tmp/fixtures-backup/fixtures/folder-1/test.txt', { disableGlob: true }))
				.then(() => syncy('.tmp/fixtures-backup/**/*.txt', '.tmp/updating-2'))
				.then(() => recursiveReaddir('.tmp/updating-2'))
				.then((result) => {
					assert.equal(result.length, 7);
				});
		});

		it('updating-3: Update the contents of a file', () => {
			// Backup test files
			return copyRecursive('fixtures', '.tmp/fixtures-backup')
				.then(() => syncy('fixtures/**', '.tmp/updating-3', { base: 'fixtures' }))
				.then(() => writeFile('.tmp/fixtures-backup/fixtures/folder-2/test.txt', 'test'))
				.then(() => syncy('.tmp/fixtures-backup/**', '.tmp/updating-3', { base: '.tmp/fixtures-backup/fixtures' }))
				.then(() => readFile('.tmp/updating-3/folder-2/test.txt', 'utf-8'))
				.then((data) => {
					assert.equal(data, 'test');
				});
		});

		it('updating-4: No update and delete files from dest (updateAndDelete)', () => {
			return createFiles('.tmp/updating-4/fixtures', 3)
				.then(() => syncy('fixtures/**', '.tmp/updating-4', { updateAndDelete: false }))
				.then(() => recursiveReaddir('.tmp/updating-4'))
				.then((result) => {
					// File `test-2.txt` overwritten
					assert.equal(result.length, 10);
				});
		});
	});

	describe.skip('Console information', () => {
		it('console-0: Verbose (true)', () => {
			// Hook for console output
			const clgDump = console.log;
			let stdout = '';
			console.log = (message: string) => {
				stdout += JSON.stringify(message);
			};

			return syncy('fixtures/**', '.tmp/console-0', { verbose: true }).then(() => {
				console.log = clgDump;
				assert.equal(/fixtures\/test-2.txt/.test(stdout), true);
			});
		});

		it('console-1: Verbose (function)', () => {
			let lastAction = '';

			const verbose = (log: LogEntry) => lastAction = log.action;

			return syncy('fixtures/**', '.tmp/console-1', { verbose }).then(() => {
				assert.equal(lastAction, 'copy');
			});
		});
	});

	describe('Ignore files', () => {
		it('ignore-0: Ignore `test-0.txt` in dest directory (ignoreInDest)', () => {
			return createFiles('.tmp/ignore-0/fixtures', 1)
				.then(() => syncy('fixtures/**', '.tmp/ignore-0', { ignoreInDest: ['**/test-0.txt'] }))
				.then(() => recursiveReaddir('.tmp/ignore-0'))
				.then((result) => {
					assert.equal(result.length, 9);
				});
		});

		it('ignore-1: Don\'t remove directory with ignored files', () => {
			return createFiles('.tmp/ignore-1/fixtures/main', 1)
				.then(() => syncy('fixtures/**', '.tmp/ignore-1', { ignoreInDest: ['**/*.txt'] }))
				.then(() => recursiveReaddir('.tmp/ignore-1'))
				.then((result) => {
					assert.equal(result.length, 9);
				});
		});

		it('ignore-2: Don\'t remove directory with multiple ignored files', () => {
			return Promise.all([
				createFiles('.tmp/ignore-2/one', 1),
				createFiles('.tmp/ignore-2/two', 1)
			])
				.then(() => syncy('fixtures/**', '.tmp/ignore-2', { base: 'fixtures', ignoreInDest: ['one/**/*', 'two/**/*'] }))
				.then(() => recursiveReaddir('.tmp/ignore-2'))
				.then((result) => {
					assert.equal(result.length, 10);
				});
		});
	});

	describe('Multiple destination', () => {
		it('multiple-0: Multiple destination directories', () => {
			return syncy('fixtures/**', ['.tmp/multiple-0-one', '.tmp/multiple-0-two'])
				.then(() => Promise.all([
					recursiveReaddir('.tmp/multiple-0-one'),
					recursiveReaddir('.tmp/multiple-0-two')
				]))
				.then((result) => {
					assert.equal(result[0].length + result[1].length, 16);
				});
		});

		it('multiple-1: Remove file in both `dest` directories', () => {
			return syncy('fixtures/**', ['.tmp/multiple-1-one', '.tmp/multiple-1-two'])
				// Remove one file in both destination directories
				.then(() => Promise.all([
					fsUtils.removeFile('.tmp/multiple-1-one/fixtures/folder-1/test.txt', { disableGlob: true }),
					fsUtils.removeFile('.tmp/multiple-1-two/fixtures/folder-1/test.txt', { disableGlob: true })
				]))
				.then(() => syncy('fixtures/**', ['.tmp/multiple-1-one', '.tmp/multiple-1-two']))
				.then(() => Promise.all([
					recursiveReaddir('.tmp/multiple-1-one'),
					recursiveReaddir('.tmp/multiple-1-two')
				]))
				.then((result) => {
					assert.equal(result[0].length + result[1].length, 16);
				});
		});
	});
});
