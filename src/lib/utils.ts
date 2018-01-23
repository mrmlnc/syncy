'use strict';

import * as fs from 'fs';
import * as path from 'path';

export function normalizePath(filepath: string): string {
	return filepath.replace(/\\/g, '/');
}

/**
 * Processing path to the source directory from destination directory
 */
export function pathFromDestToSource(destPath: string, basePath: string): string {
	let filepath = destPath;
	if (basePath) {
		filepath = path.join(basePath, destPath);
	}

	return normalizePath(filepath);
}

/**
 * Processing path to the destination directory from source directory
 */
export function pathFromSourceToDest(sourcePath: string, destPath: string, basePath: string | null): string {
	let filepath = sourcePath;
	if (basePath) {
		filepath = path.relative(basePath, sourcePath);
	}

	return normalizePath(path.join(destPath, filepath));
}

/**
 * Expanding of the directories in path
 */
export function expandDirectoryTree(filepath: string): string[] {
	const dirs = filepath.split('/');
	const tree = [dirs[0]];

	dirs.reduce((sum, current) => {
		const next = normalizePath(path.join(sum, current));

		tree.push(next);

		return next;
	});

	return tree;
}

/**
 * The reason to  not update the file
 */
export function skipUpdate(source: fs.Stats, dest: fs.Stats | null, updateAndDelete: boolean): boolean {
	if (dest && !updateAndDelete) {
		return true;
	}
	if (source.isDirectory()) {
		return true;
	}
	if (dest && compareTime(source, dest)) {
		return true;
	}

	return false;
}

/**
 * Compare update time of two files
 */
export function compareTime(source: fs.Stats, dest: fs.Stats): boolean {
	return source.ctime.getTime() < dest.ctime.getTime();
}
