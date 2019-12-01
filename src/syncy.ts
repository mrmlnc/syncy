'use strict';

import * as chalk from 'chalk';
import * as isGlob from 'is-glob';
import * as globParent from 'glob-parent';
import * as globby from 'globby';
import * as cpf from 'cp-file';
import * as minimatch from 'minimatch';

import * as glob from 'glob';

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

function assertPatternsInput(patterns: string[], dest: string): void {
	if (patterns.length === 0) {
		throw new TypeError('patterns must be a string or an array of strings');
	}

	for (let i = 0; i < patterns.length; i++) {
		if (typeof patterns[i] !== 'string' || !isGlob(patterns[i]) || !patterns[i]) {
			throw new TypeError('patterns must be a glob-pattern. See https://github.com/isaacs/node-glob#glob-primer');
		}
	}

	if (!dest || (dest && !Array.isArray(dest) && typeof dest !== 'string')) {
		throw new TypeError('dest must be a string or an array of strings');
	}
}

export async function run(patterns: string[], dest: string, sourceFiles: string[], options: IOptions, log: ILog) {
	const arrayOfPromises: Promise<any>[] = [];

	// If destination directory not exists then create it
	await io.pathExists(dest).then((exists) => {
		if (!exists) {
			return io.makeDirectory(dest);
		}
	});

	// Get files from destination directory
	const destFiles = await globby('**', <glob.IOptions>{
		cwd: dest,
		dot: true,
		nosort: true
	});

	// Get all the parts of a file path for excluded paths
	const excludedFiles = (<string[]>options.ignoreInDest).reduce((ret, pattern) => {
		return ret.concat(minimatch.match(destFiles, pattern, { dot: true }));
	}, []).map((filepath) => utils.pathFromDestToSource(filepath, options.base));

	let partsOfExcludedFiles: string[] = [];
	for (let i = 0; i < excludedFiles.length; i++) {
		partsOfExcludedFiles = partsOfExcludedFiles.concat(utils.expandDirectoryTree(excludedFiles[i]));
	}

	// Removing files from the destination directory
	if (options.updateAndDelete) {
		// Create a full list of the basic directories
		let treeOfBasePaths = [''];
		patterns.forEach((pattern) => {
			const parentDir = globParent(pattern);
			const treePaths = utils.expandDirectoryTree(parentDir);

			treeOfBasePaths = treeOfBasePaths.concat(treePaths);
		});

		const fullSourcePaths = sourceFiles.concat(treeOfBasePaths, partsOfExcludedFiles);

		// Deleting files
		for (let i = 0; i < destFiles.length; i++) {
			const destFile = destFiles[i];

			// To files in the source directory are added paths to basic directories
			const pathFromDestToSource = utils.pathFromDestToSource(destFile, options.base);

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

			const pathFromSourceToDest = utils.pathFromSourceToDest(destFile, dest, null);
			const removePromise = io.removeFile(pathFromSourceToDest, { disableGlob: true }).then(() => {
				log(<ILogItem>{
					action: 'remove',
					from: destFile,
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

export default async function syncy(source: string | string[], dest: string | string[], options?: IOptions) {
	const patterns = [].concat(source);
	const destination = [].concat(dest);

	try {
		destination.forEach((item) => {
			assertPatternsInput(patterns, item);
		});
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

	return globby(patterns, <glob.IOptions>{
		dot: true,
		nosort: true
	}).then((sourceFiles) => {
		return Promise.all(destination.map((item) => run(patterns, item, sourceFiles, options, log)));
	});
}
