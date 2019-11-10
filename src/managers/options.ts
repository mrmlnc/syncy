import { Pattern } from '../types/patterns';
import { Log } from './log';

export type Options = {
	/**
	 * Display log messages when copying and removing files.
	 */
	verbose: boolean | Log;
	/**
	 * The base path to be removed from the path.
	 */
	base: string;
	/**
	 * Remove all files from `dest` that are not found in `src`.
	 */
	updateAndDelete: boolean;
	/**
	 * Never remove specified files from destination directory.
	 */
	ignoreInDest: Pattern[];
};

export type PartialOptions = Partial<Options>;

export function prepare(options?: PartialOptions): Options {
	return {
		verbose: false,
		base: '',
		updateAndDelete: true,
		ignoreInDest: [],
		...options
	};
}
