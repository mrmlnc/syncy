'use strict';

import * as chalk from 'chalk';
import * as isGlob from 'is-glob';
import * as globParent from 'glob-parent';
import * as globby from 'globby';
import * as cpf from 'cp-file';

import glob = require('glob');

import * as io from './lib/io';
import * as utils from './lib/utils';

export interface ILogItem {
	action: 'copy' | 'remove';
	from: string;
	to: string;
}

export interface ILog {
	(log: ILogItem): void;
}

export interface IOptions {
	/**
	 * Display log messages when copying and removing files.
	 */
	verbose?: boolean | ILog;
	/**
	 * The base path to be removed from the path.
	 */
	base?: string;
	/**
	 * Remove all files from `dest` that are not found in `src`.
	 */
	updateAndDelete?: boolean;
	/**
	 * Never remove specified files from destination directory.
	 */
	ignoreInDest?: string | string[];
}

function assertPatternsInput(patterns: string[], dest: string): void {
	if (patterns.length === 0) {
		throw new TypeError('patterns must be a string or an array of strings');
	}

	for (let i = 0; i < patterns.length; i++) {
		if (typeof patterns[i] !== 'string' || !isGlob(patterns[i])) {
			throw new TypeError('patterns must be a glob-pattern. See https://github.com/isaacs/node-glob#glob-primer');
		}
	}

	if (!dest || typeof dest !== 'string') {
		throw new TypeError('dest must be a string');
	}
}

function getLogProvider(options: IOptions) {
	if (typeof options.verbose === 'function') {
		return <ILog>options.verbose;
	} else if (options.verbose) {
		return (stamp: ILogItem) => {
			let str = '';
			if (stamp.action === 'remove') {
				str = chalk.red('Removing: ') + stamp.from;
			} else if (stamp.action === 'copy') {
				str = chalk.green('Copying: ') + stamp.from + chalk.cyan(' -> ') + stamp.to;
			}
			console.log(str);
		};
	} else {
		return () => {
			// silence
		};
	}
}

export default async function syncy(patterns: string | string[], dest: string, options?: IOptions) {
	patterns = [].concat(patterns);

	try {
		assertPatternsInput(patterns, dest);
	} catch (err) {
		return Promise.reject(err);
	}

	options = Object.assign(<IOptions>{
		updateAndDelete: true,
		verbose: false,
		ignoreInDest: []
	}, options);

	options.ignoreInDest = [].concat(options.ignoreInDest);


	// If `verbose` mode is enabled
	const log = getLogProvider(options);

	// Remove latest slash for base path
	if (options.base && options.base.endsWith('/')) {
		options.base = options.base.slice(0, -1);
	}

	// If destination directory not exists create it
	const destExists = await io.pathExists(dest);
	if (!destExists) {
		await io.makeDirectory(dest);
	}

	// Settings for globby
	const files = await Promise.all([
		globby(patterns, <glob.IOptions>{ dot: true, nosort: true }),
		globby('**', <glob.IOptions>{
			cwd: dest,
			dot: true,
			nosort: true,
			ignore: options.ignoreInDest
		})
	]);

	const sourceFiles: string[] = files[0];
	const destFiles: string[] = files[1];

	// Promises
	const arrayOfPromises: Promise<any>[] = [];

	// Removing files from the destination directory
	if (options.updateAndDelete) {
		// Create a full list of the basic directories
		let treeOfBasePaths: string[] = [''];
		patterns.forEach((pattern) => {
			const parentDir = globParent(pattern);
			const treePaths = utils.expandDirectoryTree(parentDir);

			treeOfBasePaths = treeOfBasePaths.concat(treePaths);
		});

		const fullSourcePaths: string[] = sourceFiles.concat(treeOfBasePaths);

		// Deleting files
		for (let i = 0; i < destFiles.length; i++) {
			// To files in the source directory are added paths to basic directories
			const pathFromDestToSource = utils.pathFromDestToSource(destFiles[i], options.base);

			// Search unique files to the destination directory
			let skipIteration = false;
			for (let i = 0; i < fullSourcePaths.length; i++) {
				if (fullSourcePaths[i].indexOf(pathFromDestToSource) !== -1) {
					skipIteration = true;
					break;
				}
			}

			if (skipIteration) {
				continue;
			}

			const pathFromSourceToDest = utils.pathFromSourceToDest(destFiles[i], dest, null);
			const removePromise = io.removeFile(pathFromSourceToDest, { disableGlob: true }).then(() => {
				log(<ILogItem>{
					action: 'remove',
					from: destFiles[i],
					to: null
				});
			}).catch((err) => {
				throw new Error(`Cannot remove '${pathFromSourceToDest}': ${err.code}`);
			});

			arrayOfPromises.push(removePromise);
		}
	}

	// Copying files
	for (let i = 0; i < sourceFiles.length; i++) {
		const from = sourceFiles[i];
		const to = utils.pathFromSourceToDest(from, dest, options.base);

		// Get stats for source & dest file
		const statFrom = io.statFile(from);
		const statDest = io.statFile(to).catch((err) => null);

		const copyAction = Promise.all([statFrom, statDest]).then((stat) => {
			// We should update this file?
			if (utils.skipUpdate(stat[0], stat[1], options.updateAndDelete)) {
				return;
			}

			return cpf(from, to).then(() => {
				log(<ILogItem>{
					action: 'copy',
					from,
					to
				});
			}).catch((err) => {
				throw new Error(`'${from}' to '${to}': ${err.message}`);
			});
		});

		arrayOfPromises.push(copyAction);
	}

	return Promise.all(arrayOfPromises);
}
