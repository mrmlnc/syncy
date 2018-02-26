import { Pattern } from '../types/patterns';
import { Log } from './log';

export interface IOptions {
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
}

export type IPartialOptions = Partial<IOptions>;

export function prepare(options?: IPartialOptions): IOptions {
	const opts = Object.assign<IOptions, IPartialOptions | undefined>({
		verbose: false,
		base: '',
		updateAndDelete: true,
		ignoreInDest: []
	}, options);

	return opts;
}
