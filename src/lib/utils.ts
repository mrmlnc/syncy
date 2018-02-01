'use strict';

import * as fs from 'fs';

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
