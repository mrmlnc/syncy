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
	ignoreInDest: string | string[];
}

export type IPartialOptions = Partial<IOptions>;

export function prepare(options?: IPartialOptions): IOptions {
	const opts = Object.assign<IOptions, IPartialOptions | undefined>({
		verbose: false,
		base: '',
		updateAndDelete: true,
		ignoreInDest: []
	}, options);

	if (options && options.ignoreInDest) {
		opts.ignoreInDest = ([] as string[]).concat(options.ignoreInDest);
	}

	return opts;
}
