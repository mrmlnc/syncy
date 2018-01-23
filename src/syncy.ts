'use strict';

import chalk from 'chalk';

import cpf = require('cp-file');
import globParent = require('glob-parent');
import globby = require('globby');
import isGlob = require('is-glob');
import minimatch = require('minimatch');

import glob = require('glob');

import * as io from './lib/io';
import * as utils from './lib/utils';

export interface ILogItem {
	action: 'copy' | 'remove';
	from: string;
	to: string | null;
}

export type Log = (log: ILogItem) => void;

export interface IOptions {
	/**
	 * Display log messages when copying and removing files.
	 */
	verbose?: boolean | Log;
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

function getLogProvider(options: IOptions): Log {
	if (typeof options.verbose === 'function') {
		return <Log>options.verbose;
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
			// Silence
		};
	}
}

function assertPatternsInput(patterns: string[], dest: string): void {
	if (patterns.length === 0) {
		throw new TypeError('patterns must be a string or an array of strings');
	}

	for (const pattern of patterns) {
		if (!isGlob(pattern)) {
			throw new TypeError('patterns must be a glob-pattern. See https://github.com/isaacs/node-glob#glob-primer');
		}
	}

	/* tslint:disable-next-line strict-type-predicates */
	if (!dest || (dest && !Array.isArray(dest) && typeof dest !== 'string')) {
		throw new TypeError('dest must be a string or an array of strings');
	}
}

export async function run(patterns: string[], dest: string, sourceFiles: string[], options: IOptions, log: Log): Promise<void[]> {
	const arrayOfPromises: Array<Promise<void>> = [];

	// If destination directory not exists then create it
	await io.pathExists(dest).then((exists) => {
		if (!exists) {
			return io.makeDirectory(dest);
		}

		return;
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
	}, [] as string[]).map((filepath) => utils.pathFromDestToSource(filepath, options.base as string as string));

	let partsOfExcludedFiles: string[] = [];
	for (const excludedFile of excludedFiles) {
		partsOfExcludedFiles = partsOfExcludedFiles.concat(utils.expandDirectoryTree(excludedFile));
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
		for (const destFile of destFiles) {
			// To files in the source directory are added paths to basic directories
			const pathFromDestToSource = utils.pathFromDestToSource(destFile, options.base as string);

			// Search unique files to the destination directory
			let skipIteration = false;
			for (const fullSourcePath of fullSourcePaths) {
				if (fullSourcePath.indexOf(pathFromDestToSource) !== -1) {
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
	for (const from of sourceFiles) {
		const to = utils.pathFromSourceToDest(from, dest, options.base as string);

		// Get stats for source & dest file
		const statFrom = io.statFile(from);
		const statDest = io.statFile(to).catch(() => null);

		const copyAction = Promise.all([statFrom, statDest]).then((stat) => {
			// We should update this file?
			if (utils.skipUpdate(stat[0], stat[1], options.updateAndDelete as boolean)) {
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

export default async function syncy(source: string | string[], dest: string | string[], options?: IOptions): Promise<void[][]> {
	const patterns = ([] as string[]).concat(source);
	const destination = ([] as string[]).concat(dest);

	try {
		destination.forEach((item) => {
			assertPatternsInput(patterns, item);
		});
	} catch (err) {
		return Promise.reject(err);
	}

	const opts = Object.assign(<IOptions>{
		updateAndDelete: true,
		verbose: false,
		ignoreInDest: []
	}, options);

	opts.ignoreInDest = ([] as string[]).concat(opts.ignoreInDest as string[]);

	// If `verbose` mode is enabled
	const log = getLogProvider(opts);

	// Remove latest slash for base path
	if (opts.base && opts.base.endsWith('/')) {
		opts.base = opts.base.slice(0, -1);
	}

	return globby(patterns, <glob.IOptions>{
		dot: true,
		nosort: true
	}).then((sourceFiles) => {
		return Promise.all(destination.map((item) => run(patterns, item, sourceFiles, opts as IOptions, log)));
	});
}
