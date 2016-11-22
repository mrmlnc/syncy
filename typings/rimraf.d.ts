declare module "rimraf" {
	function rimraf(pattern: string, callback: (err: Error) => void): void;
	function rimraf(pattern: string, options: rimraf.IOptions, callback: (err: Error) => void): void;

	namespace rimraf {
		function sync(pattern: string, options?: IOptions): void;

		interface IOptions {
			unlink?: Function;
			chmod?: Function;
			stat?: Function;
			lstat?: Function;
			rmdir?: Function;
			readdir?: Function;
			maxBusyTries?: number;
			emfileWait?: number;
			disableGlob?: boolean;
		}
	}

	export = rimraf;
}
