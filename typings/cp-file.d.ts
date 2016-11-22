declare module "cp-file" {

	/**
	 * @param {string} source File you want to copy.
	 * @param {string} destination Where you want the file copied.
	 * @param {IOptions} [options]
	 */
	function cpfile(source: string, destination: string, options?: cpfile.IOptions): Promise<any>;

	namespace cpfile {
		interface IOptions {
			/**
			 * Overwrite existing file.
			 */
			overwrite?: boolean;
		}

		interface IProgressData {
			src: string;
			dest: string;
			size: number;
			written: number;
			percent: number;
		}

		function sync(source: string, destination: string, options?: cpfile.IOptions): void;
		/**
		 * Progress reporting. Only available when using the async method.
		 */
		function on(event: string, listener: (data?: cpfile.IProgressData) => void): Promise<any>;
	}

	export = cpfile;
}
