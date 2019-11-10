import * as path from 'path';

export function normalizePath(filepath: string): string {
	return filepath.replace(/\\/g, '/');
}

/**
 * Processing path to the source directory from destination directory
 */
export function pathFromDestinationToSource(destinationPath: string, basePath?: string): string {
	let filepath = destinationPath;

	if (basePath !== undefined) {
		filepath = path.join(basePath, destinationPath);
	}

	return normalizePath(filepath);
}

/**
 * Processing path to the destination directory from source directory
 */
export function pathFromSourceToDestination(sourcePath: string, destinationPath: string, basePath?: string): string {
	let filepath = sourcePath;

	if (basePath !== undefined) {
		filepath = path.relative(basePath, sourcePath);
	}

	return normalizePath(path.join(destinationPath, filepath));
}

/**
 * Expanding of the directories in path
 */
export function expandDirectoryTree(filepath: string): string[] {
	const directories = filepath.split('/');
	const tree = [directories[0]];

	directories.reduce((sum, current) => {
		const next = normalizePath(path.join(sum, current));

		tree.push(next);

		return next;
	});

	return tree;
}
