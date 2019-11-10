'use strict';

import * as fs from 'fs';

import * as cpf from 'cp-file';
import * as fg from 'fast-glob';
import * as minimatch from 'minimatch';

import LogManager, { Log } from './managers/log';
import * as optionsManager from './managers/options';
import { Pattern } from './types/patterns';
import * as fsUtils from './utils/fs';
import * as pathUtils from './utils/path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
import globParent = require('glob-parent');

type Options = optionsManager.Options;
type PartialOptions = optionsManager.PartialOptions;

/**
 * The reason to  not update the file
 */
export function skipUpdate(source: fs.Stats, destination: fs.Stats | null, updateAndDelete: boolean): boolean {
	if (destination !== null && !updateAndDelete) {
		return true;
	}

	if (source.isDirectory()) {
		return true;
	}

	if (destination !== null && compareTime(source, destination)) {
		return true;
	}

	return false;
}

/**
 * Compare update time of two files
 */
export function compareTime(source: fs.Stats, destination: fs.Stats): boolean {
	return source.ctime.getTime() < destination.ctime.getTime();
}

export function getDestinationEntries(destination: string): Promise<string[]> {
	return fg<string>('**', { cwd: destination, dot: true, onlyFiles: false });
}

export function getSourceEntries(patterns: Pattern | Pattern[]): Promise<string[]> {
	return fg<string>(patterns, { dot: true, onlyFiles: false });
}

/**
 * Get all the parts of a file path for excluded paths.
 */
export function getPartsOfExcludedPaths(destinationFiles: string[], options: Options): string[] {
	return options.ignoreInDest
		.reduce((collection, pattern) => collection.concat(minimatch.match(destinationFiles, pattern, { dot: true })), [] as string[])
		.map((filepath) => pathUtils.pathFromDestinationToSource(filepath, options.base))
		.reduce((collection, filepath) => collection.concat(pathUtils.expandDirectoryTree(filepath)), [] as string[]);
}

export function getTreeOfBasePaths(patterns: Pattern[]): string[] {
	return patterns.reduce((collection, pattern) => {
		const parentDirectory = globParent(pattern);
		const treePaths = pathUtils.expandDirectoryTree(parentDirectory);

		return collection.concat(treePaths);
	}, ['']);
}

export async function run(patterns: Pattern[], destination: string, sourceFiles: string[], options: Options, log: Log): Promise<void[]> {
	const arrayOfPromises: Array<Promise<void>> = [];

	// If destination directory not exists then create it
	const isExists = await fsUtils.pathExists(destination);
	if (!isExists) {
		await fsUtils.makeDirectory(destination);
	}

	// Get files from destination directory
	const destinationFiles = await getDestinationEntries(destination);
	const partsOfExcludedFiles = getPartsOfExcludedPaths(destinationFiles, options);

	// Removing files from the destination directory
	if (options.updateAndDelete) {
		// Create a full list of the basic directories
		const treeOfBasePaths = getTreeOfBasePaths(patterns);
		const fullSourcePaths = sourceFiles.concat(treeOfBasePaths, partsOfExcludedFiles);

		// Deleting files
		for (const destinationFile of destinationFiles) {
			// To files in the source directory are added paths to basic directories
			const pathFromDestinationToSource = pathUtils.pathFromDestinationToSource(destinationFile, options.base);

			// Search unique files to the destination directory
			let skipIteration = false;
			for (const fullSourcePath of fullSourcePaths) {
				if (fullSourcePath.includes(pathFromDestinationToSource)) {
					skipIteration = true;
					break;
				}
			}

			if (skipIteration) {
				continue;
			}

			const pathFromSourceToDestination = pathUtils.pathFromSourceToDestination(destinationFile, destination);
			const removePromise = fsUtils.removeFile(pathFromSourceToDestination, { disableGlob: true }).then(() => {
				log({
					action: 'remove',
					from: destinationFile,
					to: undefined
				});
			}).catch((error) => {
				throw new Error(`Cannot remove '${pathFromSourceToDestination}': ${error.code}`);
			});

			arrayOfPromises.push(removePromise);
		}
	}

	// Copying files
	for (const from of sourceFiles) {
		const to = pathUtils.pathFromSourceToDestination(from, destination, options.base);

		// Get stats for source & dest file
		const statFrom = fsUtils.statFile(from);
		const statDestination = fsUtils.statFile(to).catch(() => null);

		const copyAction = Promise.all([statFrom, statDestination]).then((stat) => {
			// We should update this file?
			if (skipUpdate(stat[0], stat[1], options.updateAndDelete)) {
				return undefined;
			}

			return cpf(from, to).then(() => {
				log({
					from,
					to,
					action: 'copy'
				});
			}).catch((error) => {
				throw new Error(`'${from}' to '${to}': ${error.message}`);
			});
		});

		arrayOfPromises.push(copyAction);
	}

	return Promise.all(arrayOfPromises);
}

export default async function syncy(source: Pattern | Pattern[], destination: string | string[], options?: PartialOptions): Promise<void[][]> {
	const patterns = ([] as Pattern[]).concat(source);
	const destinations = ([] as string[]).concat(destination);

	const preparedOptions = optionsManager.prepare(options);

	const logManager = new LogManager(preparedOptions);
	const logger = logManager.info.bind(logManager);

	return getSourceEntries(source).then((sourceFiles) => {
		return Promise.all(destinations.map((item) => run(patterns, item, sourceFiles, preparedOptions, logger)));
	});
}
