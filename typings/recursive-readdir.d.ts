declare module "recursive-readdir" {
	import fs = require('fs');

	namespace RecursiveReaddir {
		interface IReaddir {
			(path: string, callback: (error: Error, files: string[]) => any): void;
			(path: string, ignorePattern: (string | ((file: string, stats: fs.Stats) => void))[], callback: (error: Error, files: string[]) => any): void;
			(path: string, ignoreFunction: (file: string, stats: fs.Stats) => void, callback: (error: Error, files: string[]) => any): void;
		}
	}

	const r: RecursiveReaddir.IReaddir;
	export = r;
}
