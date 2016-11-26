declare module "globby" {

	import glob = require('glob');

	function globby(patterns: string | string[], options?: glob.IOptions): Promise<string[]>;

	namespace globby {
		interface IGlobTasks {
			patternt: string;
			opts: glob.IOptions;
		}

		function sync(patterns: string[], options?: glob.IOptions): string[];
		function generateGlobTasks(patterns: string[], options?: glob.IOptions): globby.IGlobTasks[];
	}

	export = globby;
}
